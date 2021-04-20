import React from "react";
import { List, ListItem, Title, TitleSizes } from "@patternfly/react-core";
import { Node } from "../../models/Node";
import Service from "../../models/Service";

type ServiceResultsProps = {
  services: Service[];
};
const ServiceResults: React.FC<ServiceResultsProps> = ({ services }) => (
  <List className="services left-margined">
    {services.map((service, i) => (
      <ListItem key={i}>{service.getDetails()}</ListItem>
    ))}
  </List>
);

type NodeResultsProps = {
  node: Node;
};

const NodeResults: React.FC<NodeResultsProps> = ({ node }) => {
  return (
    <div className="node-item left-margined">
      <div>
        This node has {node.getUsedCPU()} / {node.cpuUnits} used CPU units,{" "}
        {node.getUsedMemory()} / {node.memory} used GB of memory and{" "}
        {node.getAmountOfOSDs()} / {node.maxDisks} disks.
      </div>
      <div>
        Services on THIS node:
        {<ServiceResults services={node.services} />}
      </div>
    </div>
  );
};

type ReplicaSetResultsProps = {
  nodes: Node[];
};

export const ReplicaSetResults: React.FC<ReplicaSetResultsProps> = ({
  nodes,
}) => {
  return (
    <div className="node-list left-margined">
      {nodes.map((node, i) => (
        <React.Fragment key={i}>
          <div>
            <Title headingLevel="h5" size={TitleSizes.lg}>
              Node {(i + 1).toFixed(0)}
            </Title>
          </div>
          <NodeResults key={i} node={node} />
        </React.Fragment>
      ))}
    </div>
  );
};