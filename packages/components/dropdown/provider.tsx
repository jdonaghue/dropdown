"use client"

import React, { Component, PropsWithChildren } from "react";
import _ from "lodash";
import { Security, TemplateConfig } from "@/packages/types/types";

import { calculateColumnTemplateFromMap } from "./security";

type Props = {
  width?: number;
} & PropsWithChildren;

export type SecurityContextValue = {
  width?: number;
  templateForText: string[];
  templateForOptions: string[];
  compileTemplate: (
    securities: Security[],
    config: TemplateConfig,
  ) => string[];
  registerSecuritiesWithProviderMemoized: (
    securities: Security[],
    sort: keyof Security,
    sortDirection: "ASC" | "DESC",
    compileConfig: TemplateConfig,
    type: TemplateType,
  ) => string[];
};

export enum TemplateType {
  TEXT,
  OPTIONS,
};

export type SecurityContextState = {
  value: SecurityContextValue | null;
}

export const SecuritiesDDContext = React.createContext<SecurityContextValue | null>(null);

const memoCalculateTemplate = (method: (securities: Security[], config: TemplateConfig) => string[]) => {
  const cache: {
    [key: string]: string[];
  } = {};

  return (securities: Security[], config: TemplateConfig) => {
    // const securitiesToSort = securities.map(({ defaultSecurityId }) => defaultSecurityId);
    // securitiesToSort.sort();
    // const serialized = JSON.stringify({ width: config.width, securities: securitiesToSort });
    // if (!cache[serialized]) {
      // cache[serialized] = method.call(this, securities, config);
    // }
    // return cache[serialized];
    return method.call(this, securities, config);
  };
};

export default class SecuritiesDDProvider extends Component<Props> {
  securities: Record<string, Security>;

  state: SecurityContextState;

  cache: Record<string, string[]>;

  constructor(props: Props) {
    super(props);

    this.securities = {};
    this.cache = {};

    this.state = {
      value: {
        width: props.width,
        templateForText: [] as string[],
        templateForOptions: [] as string[],
        compileTemplate: this.compileTemplate,
        registerSecuritiesWithProviderMemoized: this.registerSecuritiesWithProviderMemoized,
      },
    };
  }

  componentDidUpdate(prevProps: Readonly<Props>): void {
    if (prevProps.width != this.props.width) {
      this.setState({
        value: {
          ...this.state.value,
          width: this.props.width,
        }
      });
    }
  }

  registerSecuritiesWithProviderMemoized = (securities: Security[], sort: keyof Security, sortDirection: "ASC" | "DESC", compileConfig: TemplateConfig, type: TemplateType) => {
    const key = `${JSON.stringify(securities)}-${type}-${sort}-${sortDirection}`;

    if (!this.cache[key]) {
      this.cache[key] = this.compileTemplate(securities, { contain: true, ...compileConfig, securities });
      this.setState({
        value: {
          ...this.state.value,
          [type === TemplateType.OPTIONS ? "templateForOptions" : "templateForText"]: this.cache[key],
        }
      });
    }

    return this.cache[key];
  };

  /**
   * builds a new column widths template based on the data found within
   * `securities` and `config`.
   */
  compileTemplate = memoCalculateTemplate(( securities: Security[], config: TemplateConfig) => {
    return calculateColumnTemplateFromMap({
      ...config,
      securities,
    });
  });

  render() {
    return <SecuritiesDDContext.Provider value={this.state.value}>{this.props.children}</SecuritiesDDContext.Provider>;
  }
}
