import * as draw from "./draw";

export class Cluster {
  replicaSets: Array<ReplicaSet>;
  platform: string;
  diskType: Disk;
  nodeCPU: number;
  nodeMemory: number;
  canvas;
  static replicaCount = 3;

  constructor(
    platform: string,
    diskType: Disk,
    targetCapacity: number,
    nodeCPU: number,
    nodeMemory: number
  ) {
    this.platform = platform;
    this.diskType = diskType;
    this.nodeCPU = nodeCPU;
    this.nodeMemory = nodeMemory;
    // this.calculateIOPs(platform, diskType)
    this.canvas = draw.getCanvas();
    this.replicaSets = [
      new ReplicaSet(
        this.platform,
        Cluster.replicaCount,
        this.nodeCPU,
        this.nodeMemory
      ),
    ];
    // this.addReplicaSet();
    this.addService(new Ceph_MGR());
    this.addService(new Ceph_MON());
    this.addService(new Ceph_RGW());
    this.addService(new Ceph_MDS());
    this.addService(new NooBaa_DB());
    this.addService(new NooBaa_Endpoint());
    this.addService(new NooBaa_core());

    const osdsNeededForTargetCapacity = Math.ceil(
      targetCapacity / diskType.capacity
    );

    for (let i = 0; i < osdsNeededForTargetCapacity; i++) {
      this.addService(new Ceph_OSD());
    }
  }

  // calculateIOPs(platform: string, diskType: Disk): void {
  // 	switch (this.platform) {
  // 		case "metal":
  // 		case "vm":
  // 			// TODO: Needs more IOPs logic
  // 			// For clouds we can make it dependent on the size of the disk
  // 			diskType.iops = 100000;
  // 			break;
  // 		case "awsAttached":
  // 			diskType.iops = 130000;
  // 			break;
  // 		case "awsEBS":
  // 			diskType.iops = 18750;
  // 			break;
  // 	}
  // 	(<HTMLInputElement>$("#diskSpeedValue")[0]).value = diskType.iops.toLocaleString();
  // }

  addReplicaSet(): void {
    this.replicaSets.push(
      new ReplicaSet(
        this.platform,
        Cluster.replicaCount,
        this.nodeCPU,
        this.nodeMemory
      )
    );
  }

  addService(service: Service): void {
    // Use the replicaSet that was added last
    // We assume that we fill up replicaSets before we add new ones
    const targetSet = this.replicaSets[this.replicaSets.length - 1];
    if (!targetSet.addService(service)) {
      // If the set refuses to add the service
      // it is probably already full - then add a new set
      this.addReplicaSet();
      this.addService(service);
    }
  }
  print(): string {
    let message =
      "<p>" +
      `To reach the target capacity with the above constraints, we need ${
        this.replicaSets.length * Cluster.replicaCount
      } nodes\n`;
    message += `Each node has ${this.replicaSets[0].nodes[0].cpuUnits} <span data-toggle="tooltip" data-placement="top" title="CPU Units are the number of threads you see on the host - you get this number with nproc" style="text-decoration: underline;">CPU Units</span>, ${this.replicaSets[0].nodes[0].memory} GB memory and a maximum of ${this.replicaSets[0].nodes[0].maxDisks} disks.\n`;
    message += `The disk size in this cluster is ${this.diskType.capacity} TB`;
    return message + "</p>";
  }

  printAdvanced(indentation = ""): string {
    let message = "";
    for (let i = 0; i < this.replicaSets.length; i++) {
      message +=
        `\n\nNodeSet ${i + 1}` + this.replicaSets[i].print(indentation);
    }
    return message;
  }

  printSKU(indentation = ""): string {
    let totalSKUCores = 0,
      totalCores = 0,
      totalMemory = 0,
      totalDisks = 0;
    for (let i = 0; i < this.replicaSets.length; i++) {
      const replicaSet = this.replicaSets[i];
      for (let j = 0; j < replicaSet.nodes.length; j++) {
        const node = replicaSet.nodes[j];
        // SKUs cannot be shared between nodes
        // Thus we need to round up to the next round number
        totalCores += node.getUsedCPU();
        totalSKUCores += 2 * Math.round(Math.ceil(node.getUsedCPU()) / 2);
        totalMemory += node.getUsedMemory();
        totalDisks += node.getAmountOfOSDs();
      }
    }
    let message =
      "<p>" +
      indentation +
      `This cluster requires of a total of ${totalCores} <span data-toggle="tooltip" data-placement="top" title="CPU Units are the number of threads you see on the host - you get this number with nproc" style="text-decoration: underline;">CPU Units</span>, ${totalMemory} GB RAM and ${totalDisks} OSDs\n`;
    message +=
      indentation +
      `Factoring in that SKUs cannot be shared between nodes, we have to calculate the SKUs with ${totalSKUCores} <span data-toggle="tooltip" data-placement="top" title="CPU Units are the number of threads you see on the host - you get this number with nproc" style="text-decoration: underline;">CPU Units</span>\n`;
    if (totalSKUCores < 48) {
      message +=
        indentation +
        "This cluster is small enough to qualify for a StarterPack SKU!";
    } else {
      message +=
        indentation +
        `This requires a total of ${Math.ceil(
          totalSKUCores / 2
        )} RSU00181 SKUs`;
    }
    return message + "</p>";
  }

  draw(): void {
    let topPad = 0;
    this.replicaSets.forEach((replicaSet) => {
      replicaSet.draw(this.canvas, topPad);
      topPad += 300;
    });
  }
}

export class ReplicaSet {
  replicaCount: number;
  platform: string;
  nodes: Array<Node>;

  constructor(
    platform: string,
    replicaCount: number,
    nodeCPU: number,
    nodeMemory: number
  ) {
    this.replicaCount = replicaCount;
    this.platform = platform;
    this.nodes = [];
    for (let i = 0; i < this.replicaCount; i++) {
      switch (this.platform) {
        case "metal":
          this.nodes.push(new BareMetal(20, nodeCPU, nodeMemory));
          break;
        case "awsAttached":
          this.nodes.push(new AWSattached());
          break;
        case "awsEBS":
          this.nodes.push(new AWSEBS());
          break;
        case "vm":
        case "vmPreview":
          this.nodes.push(new VMnode(20, nodeCPU, nodeMemory));
          break;
      }
    }
  }

  addService(service: Service): boolean {
    let serviceAddRefused = false;
    switch (Object.getPrototypeOf(service).constructor) {
      // Services running on 3 nodes
      case Ceph_MON:
      case Ceph_OSD:
        this.nodes.forEach((node) => {
          if (!node.canIAddService(service)) {
            serviceAddRefused = true;
          }
        });
        if (serviceAddRefused) return false;
        this.nodes.forEach((node) => {
          node.addService(service);
        });
        return true;
      // Services running on 2 nodes
      case Ceph_MDS:
      case Ceph_MGR:
      case Ceph_RGW:
      case NooBaa_DB:
      case NooBaa_Endpoint:
      case NooBaa_core:
        // Sort nodes ascending based on used CPU
        this.nodes.sort(function (a, b) {
          if (a.getUsedCPU() < b.getUsedCPU()) return -1;
          else return 1;
        });
        for (let i = 0; i < Math.min(this.nodes.length, 2); i++) {
          const node = this.nodes[i];
          if (!node.canIAddService(service)) return false;
        }
        for (let i = 0; i < Math.min(this.nodes.length, 2); i++) {
          const node = this.nodes[i];
          node.addService(service);
        }
        return true;
    }
    return false;
  }

  print(indentation = ""): string {
    let message = "";
    for (let i = 0; i < this.nodes.length; i++) {
      message +=
        `\n${indentation}node ${i + 1}\n` +
        this.nodes[i].print(indentation + indentation);
    }
    return message;
  }

  draw(canvas: fabric.StaticCanvas, topPad: number): void {
    let leftPad = 0;
    this.nodes.forEach((node) => {
      draw.drawNode(canvas, node, leftPad, topPad);
      leftPad += 300;
    });
    canvas.renderAll();
  }
}

export abstract class Node {
  maxDisks: number;
  cpuUnits: number;
  memory: number;
  services: Array<Service>;

  constructor(maxDisks = 0, cpuUnits = 0, memory = 0) {
    this.services = [];

    this.maxDisks = maxDisks;
    this.cpuUnits = cpuUnits;
    this.memory = memory;
  }

  getUsedMemory(): number {
    let totalMemory = 0;
    this.services.forEach((service) => {
      totalMemory += Object.getPrototypeOf(service).constructor.requiredMemory;
    });
    return totalMemory;
  }
  getUsedCPU(): number {
    let totalCores = 0;
    this.services.forEach((service) => {
      totalCores += Object.getPrototypeOf(service).constructor.requiredCPU;
    });
    // 2 * Math.round(Math.ceil(node.getUsedCPU()) / 2)
    return 2 * Math.round(Math.ceil(totalCores) / 2);
  }
  canIAddService(service: Service): boolean {
    if (
      this.getUsedCPU() +
        Object.getPrototypeOf(service).constructor.requiredCPU >
        this.cpuUnits ||
      this.getUsedMemory() +
        Object.getPrototypeOf(service).constructor.requiredMemory >
        this.memory
    ) {
      return false;
    }
    if (
      service instanceof Ceph_OSD &&
      this.getAmountOfOSDs() >= this.maxDisks
    ) {
      return false;
    }
    return true;
  }
  addService(service: Service): boolean {
    if (this.canIAddService(service)) {
      this.services.push(service);
      return true;
    }
    return false;
  }
  getAmountOfOSDs(): number {
    let osdCount = 0;
    this.services.forEach((service) => {
      if (service instanceof Ceph_OSD) {
        osdCount++;
      }
    });
    return osdCount;
  }
  nodeHasService(service: Service): boolean {
    this.services.forEach((nodeService) => {
      if (nodeService instanceof Object.getPrototypeOf(service)) {
        return true;
      }
    });
    return false;
  }

  print(indentation = ""): string {
    let message =
      indentation +
      `This node has ${this.getUsedCPU()} used CPU units, ${this.getUsedMemory()} used GB of memory and ${this.getAmountOfOSDs()} disks\n`;
    message += indentation + "SERVICES ON THIS node:";
    this.services.forEach((service) => {
      message += "\n" + service.print(indentation + indentation);
    });
    return message;
  }

  abstract getFittingNodeSize(): string;
}

export class BareMetal extends Node {
  constructor(maxDisks = 20, cpuUnits = 24, memory = 64) {
    super();
    this.maxDisks = maxDisks;
    this.cpuUnits = cpuUnits;
    this.memory = memory;
  }

  getFittingNodeSize(): string {
    return `${this.cpuUnits} CPUs | ${this.memory} GB RAM`;
  }
}

export class VMnode extends Node {
  // Per node we can have at most 30 disks per SATA adapter and
  // max 4 adapters = 120 disks in total (minus OS disk)
  // https://configmax.vmware.com/guest?vmwareproduct=vSphere&release=vSphere%207.0&categories=1-0

  constructor(maxDisks = 20, cpuUnits = 40, memory = 128) {
    super();
    this.maxDisks = maxDisks;
    this.cpuUnits = cpuUnits;
    this.memory = memory;
  }

  getFittingNodeSize(): string {
    return `${this.cpuUnits} CPUs | ${this.memory} GB RAM`;
  }
}

export class AWSattached extends Node {
  // node storage i3en.2xl
  // 2 x 2.5TB disks
  constructor(maxDisks = 2, cpuUnits = 8, memory = 64) {
    super();
    this.maxDisks = maxDisks;
    this.cpuUnits = cpuUnits;
    this.memory = memory;
  }

  getFittingNodeSize(): string {
    if (this.getAmountOfOSDs() == 0) {
      return "m5.2xlarge";
    }
    return "i3en.2xlarge";
  }
}

export class AWSEBS extends Node {
  // node with EBS based on m5 nodes

  // Linux nodes should not have more than 40 EBS volumes
  // https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#linux-specific-volume-limits
  constructor(maxDisks = 20, cpuUnits = 16, memory = 64) {
    super();
    this.maxDisks = maxDisks;
    this.cpuUnits = cpuUnits;
    this.memory = memory;
  }

  getFittingNodeSize(): string {
    return "m5.4xlarge";
  }
}

export class Disk {
  capacity: number;
  iops = 0;
  constructor(capacity: number) {
    this.capacity = capacity;
  }
}

export abstract class Service {
  static requiredMemory: number;
  static requiredCPU: number;

  abstract print(indentation: string): string;
}

export class NooBaa_core extends Service {
  static requiredMemory = 4;
  static requiredCPU = 1;

  print(indentation = ""): string {
    return indentation + "NooBaa Core";
  }
}

export class NooBaa_DB extends Service {
  static requiredMemory = 4;
  static requiredCPU = 0.5;

  print(indentation = ""): string {
    return indentation + "NooBaa DB";
  }
}

export class NooBaa_Endpoint extends Service {
  static requiredMemory = 2;
  static requiredCPU = 1;

  print(indentation = ""): string {
    return indentation + "NooBaa Endpoint";
  }
}

export class Ceph_MDS extends Service {
  static requiredMemory = 8;
  static requiredCPU = 3;

  print(indentation = ""): string {
    return indentation + "Ceph MDS";
  }
}

export class Ceph_MGR extends Service {
  static requiredMemory = 3.5;
  static requiredCPU = 1;

  print(indentation = ""): string {
    return indentation + "Ceph MGR";
  }
}

export class Ceph_MON extends Service {
  static requiredMemory = 2;
  static requiredCPU = 1;

  print(indentation = ""): string {
    return indentation + "Ceph MON";
  }
}

export class Ceph_OSD extends Service {
  static requiredMemory = 5;
  static requiredCPU = 2;

  print(indentation = ""): string {
    return indentation + "Ceph OSD";
  }
}

export class Ceph_RGW extends Service {
  static requiredMemory = 4;
  static requiredCPU = 2;

  print(indentation = ""): string {
    return indentation + "Ceph RGW";
  }
}