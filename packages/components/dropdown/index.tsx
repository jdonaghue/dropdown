"use client"

import React from "react";

import InternalSecuritiesDD, { DropdownProps } from "./drop_down";
import SecuritiesDDProvider from "./provider";
import SecuritiesDDConsumer from "./consumer";

export { SecuritiesDDProvider as Provider, SecuritiesDDConsumer as Consumer };

export default class SecuritiesDD extends React.Component<DropdownProps> {
  render() {
    const content = (
      <SecuritiesDDConsumer key={this.props.security?.defaultSecurityId}>
        {(props) => {
          return (
            <InternalSecuritiesDD
              {...this.props}
              key={`${this.props.security?.defaultSecurityId}-internaldd`}
              templateForText={props?.templateForText}
              templateForOptions={props?.templateForOptions}
              compileTemplate={props?.compileTemplate as () => []}
              registerSecuritiesWithProviderMemoized={props?.registerSecuritiesWithProviderMemoized as () => []}
            />
          );
        }}
      </SecuritiesDDConsumer>
    );

    if (this.props.withinProvider) {
      return content;
    }
    return <SecuritiesDDProvider>{content}</SecuritiesDDProvider>;
  }
}
