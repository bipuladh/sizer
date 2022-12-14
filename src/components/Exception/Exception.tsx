import * as React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionToggle,
  Alert,
  AlertActionLink,
} from "@patternfly/react-core";
import { SupportExceptionObject, getSupportExceptions } from "./utils";
import "./exception.css";
import { Platform, DeploymentType } from "../../types";

type ExceptionAlertProps = {
  platform: Platform;
  flashSize: number;
  deployment: DeploymentType;
};

type ExceptionReportProps = {
  exceptions: SupportExceptionObject[];
  className?: string;
  toggleClassName?: string;
};

export const ExceptionReport: React.FC<ExceptionReportProps> = ({
  exceptions,
  className,
  toggleClassName,
}) => {
  const [expanded, setExpanded] = React.useState(new Set<string>());
  const onToggle = (id: string) =>
    setExpanded((curr) => {
      curr.has(id) ? curr.delete(id) : curr.add(id);
      return new Set([...curr]);
    });
  if (!exceptions || exceptions?.length === 0) return null;
  return (
    <Accordion asDefinitionList={false}>
      {exceptions.map((item) => (
        <AccordionItem key={item.issue}>
          <AccordionToggle
            onClick={() => onToggle(item.issue)}
            isExpanded={expanded.has(item.issue)}
            id={item.issue}
            className={toggleClassName}
          >
            {item.header}
          </AccordionToggle>
          <AccordionContent
            id={`${item.issue}-content`}
            isHidden={!expanded.has(item.issue)}
            className={className}
          >
            {item.message}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};

const ExceptionAlert: React.FC<ExceptionAlertProps> = ({
  platform,
  deployment,
  flashSize,
}) => {
  const [isOpen, setOpen] = React.useState(false);

  const exceptions = React.useMemo(
    () => getSupportExceptions(flashSize, platform, deployment),
    [flashSize, platform, deployment]
  );

  React.useEffect(() => {
    if (exceptions.length > 0) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [exceptions]);

  return isOpen ? (
    <Alert
      isInline
      variant="warning"
      title="Support Exception"
      actionLinks={
        <React.Fragment>
          <AlertActionLink
            onClick={() =>
              window.open(
                "https://access.redhat.com/articles/4731161",
                "_blank"
              )
            }
          >
            Supportability and Interoperability Guide
          </AlertActionLink>
          <AlertActionLink
            onClick={() =>
              window.open("https://access.redhat.com/labs/ocssi/", "_blank")
            }
          >
            Supportability and Interoperability Checker
          </AlertActionLink>
        </React.Fragment>
      }
    >
      <div>
        <div>
          <ExceptionReport
            exceptions={exceptions}
            toggleClassName="exception-alert__toggle"
            className="exception-alert__body"
          />
        </div>
        <div>
          This cluster is not within the regular support limits. You will need a
          support exception!
        </div>
      </div>
    </Alert>
  ) : null;
};

export default ExceptionAlert;
