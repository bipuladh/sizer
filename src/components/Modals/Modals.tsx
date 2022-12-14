import * as React from "react";
import * as ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { store } from "../../redux/store";

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const launchModal = (ModalComponent, props) => {
  const domElement = document.getElementById("modal-container");

  const onClose = () => {
    domElement && ReactDOM.unmountComponentAtNode(domElement);
  };

  ReactDOM.render(
    <>
      <Provider store={store}>
        <ModalComponent {...props} onClose={onClose} />
      </Provider>
    </>,
    domElement
  );
};
