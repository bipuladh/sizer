import * as React from "react";
import {
  SelectOption,
  Select,
  SelectVariant,
  FormGroup,
} from "@patternfly/react-core";
import { Store } from "../../redux";
import { useDispatch, useSelector } from "react-redux";
import { CM_MODAL_ID } from "../Compute/MachineSetCreate";
import { openModalAction } from "../../redux";
import "./instancePlanning.css";
import { ODF_DEDICATED_MS_NAME } from "../../constants";

const CreateOption: React.FC = () => (
  <SelectOption value="create-option">Create custom MachineSet</SelectOption>
);

type InstancePlanningProps = {
  createdMS?: string;
  onSelect?: (name: string) => void;
};

const InstancePlanning: React.FC<InstancePlanningProps> = ({
  createdMS,
  onSelect: onSelect,
}) => {
  const machineSets = useSelector((store: Store) => store.machineSet);
  const undedicatedMachineSets = machineSets.filter(
    (ms) => ms.onlyFor.length === 0 || ms.onlyFor?.[0] === ODF_DEDICATED_MS_NAME
  );
  const [isOpen, setOpen] = React.useState(false);
  const [selectedOption, setSelected] = React.useState(null);

  const dispatch = useDispatch();

  React.useEffect(() => {
    if (createdMS) {
      setSelected(createdMS);
    }
  }, [createdMS]);

  const machineSetOptions = [
    <CreateOption key="create-option" />,
    ...undedicatedMachineSets.map(({ name, id }) => (
      <SelectOption key={id} value={name} />
    )),
  ];

  const onSelected = (event, selection) => {
    if (selection === "create-option") {
      console.log("Create Option");
      dispatch(openModalAction(CM_MODAL_ID));
    } else {
      setSelected(selection);
      onSelect ? onSelect(selection) : null;
    }
    setOpen(false);
  };

  return (
    <FormGroup fieldId="instance-selector" label="Machine Instance">
      <Select
        className="storage-ms__instance-select"
        variant={SelectVariant.single}
        onToggle={() => setOpen((o) => !o)}
        onSelect={onSelected}
        selections={selectedOption}
        isOpen={isOpen}
        aria-label="Select Instance"
        id="instance-selector"
        isDisabled={createdMS === ODF_DEDICATED_MS_NAME}
      >
        {machineSetOptions}
      </Select>
    </FormGroup>
  );
};

export default InstancePlanning;