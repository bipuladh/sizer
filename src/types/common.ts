import { Zone } from "./Zone";

export type NodeDetails<T> = {
  usedCpuUnits: number;
  usedMemory: number;
  amountOfOSDs: number;
  workloads: {
    [workloadName: string]: T;
  };
};

export const enum Platform {
  BAREMETAL = "BareMetal",
  GCP = "GCP",
  AZURE = "AZURE",
  VMware = "VMware",
  RHV = "RHV",
  AWS = "AWS",
}

export const enum DeploymentType {
  INTERNAL = "internal",
  EXTERNAL = "external",
  COMPACT = "compact",
  MINIMAL = "minimal",
}

export type DeploymentDetails = {
  ocpNodes: number;
  cpuUnits: number;
  memory: number;
  diskCapacity?: number;
  // deploymentType: DeploymentType;
  // nvmeTuning: boolean;
  // warningFirst: number;
  // warningSecond: number;
  zones: Zone[];
};

export type Instance = {
  name: string;
  memory: number;
  cpuUnits: number;
  instanceStorage?: number;
  default?: boolean;
  controlPlane?: boolean;
};