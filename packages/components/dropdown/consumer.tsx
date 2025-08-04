"use client"

import React, { PropsWithChildren } from "react";

import { SecuritiesDDContext, SecurityContextValue } from "./provider";

export default function SecuritiesDDConsumer({ children }: { children: (props: SecurityContextValue | null) => React.JSX.Element}) {
  return (
    <SecuritiesDDContext.Consumer>
      {(props) => {
        return children(props);
      }}
    </SecuritiesDDContext.Consumer>
  );
}
