"use client"

import React from "react";
import styled from "styled-components";
import { Dropdown } from "semantic-ui-react";
import { v1 as uuidv1 } from "uuid";

import { sorter } from "@/packages/utils/securities";
import { KeyWordType, Option, Security as SecurityType, TemplateConfig, SecurityField, } from "@/packages/types/types";

import Security, {
  formatAsString,
  SECURITY_COLUMNS,
  SECURITY_COLUMNS_MAP,
  SecurityComponentProps
} from "./security";
import DynamicHeader from "./dynamic_header";
import { search, SECURITY_SEARCH_KEYWORD_PROPERTIES } from "./search";
import { TemplateType } from "./provider";

const StyledDropdown = styled(Dropdown)`
  &&& {
    background-color: ${(props) => {
      if (props.errorhighlight === "true") {
        return props.theme.sec_dd_err_bg_color;
      } else {
        return props.theme.sec_dd_bg_color;
      }
    }};
    border: ${(props) => {
      if (props.errorhighlight === "true") {
        return "1px solid red";
      } else {
        return "1px solid gray";
      }
    }};
    width: ${(props) => props.width};
    min-height: 40px;
    max-height: 40px;

    > .text {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      width: calc(100% - 5px);
    }

    .visible.menu {
      overflow-x: auto;
      white-space: nowrap;
      min-width: ${(props) => props.width};
      width: fit-content;
      max-width: 75vw;

      .message {
        margin: 0;
      }
    }
  }
`;

const StyledDynamicHeader = styled(DynamicHeader)`
  font-weight: bold;
  line-height: 1em;
  width: fit-content;
  white-space: nowrap;
  position: sticky;
  top: 0;
  background: white;
  padding: 0.75rem 1.16666667rem !important;
  z-index: 9999;
  cursor: pointer;
  user-select: none;

  border-top: 1px solid grey;
  border-bottom: 1px solid grey;
  background: linear-gradient(#eee 10%, #ddd 30%, #eee 60%);

  > div {
    user-select: none;
  }
` as typeof DynamicHeader;

const ensureUniqueSecurities: ensureUniqueMethod<SecurityType> = (items, ids = {}) => {
  return (items || []).filter((item) => {
    if (ids[item.defaultSecurityId]) {
      return false;
    }
    return (ids[item.defaultSecurityId] = true);
  });
};

const memoComputeChangeProps = (method: (
  newData: DropdownProps,
  oldData: Partial<DropdownProps>,
  configMap: DiffableProperty,
) => ChangeSet[]) => {
  const cache: {
    [key: string]: ChangeSet[];
  } = {};
  return (
    newData: DropdownProps,
    oldData: Partial<DropdownProps>,
    configMap: DiffableProperty
  ) => {
    const serialized = JSON.stringify({ newData, oldData, configMap });
    cache[serialized] = cache[serialized] ?? method.call(this, newData, oldData, configMap);
    return cache[serialized];
  };
};

const memoComputeChangeState = (method: (
  newData: Partial<DropdownState>,
  oldData: DropdownState,
  configMap: DiffableState,
) => ChangeSet[]) => {
  const cache: {
    [key: string]: ChangeSet[];
  } = {};
  return (
    newData: Partial<DropdownState>,
    oldData: DropdownState,
    configMap: DiffableState
  ) => {
    const serialized = JSON.stringify({ newData, oldData, configMap });
    cache[serialized] = cache[serialized] ?? method.call(this, newData, oldData, configMap);
    return cache[serialized];
  };
};

export type ensureUniqueMethod<Type> = (items: Type[], ids: Record<string, boolean>) => Type[];

type DiffableDefinition = {
  process?: "deferred" | "immediately";
  selectors?: string[];
  ensureUnique?: ensureUniqueMethod<SecurityType>;
  immediateButNotAloneSufficientForRecomputingOptions?: boolean;
  doNotApplyDirectly?: boolean;
  name?: string;
  order: number;
  isDelta?: (a: any, b: any) => boolean;
};

export type DropdownProps = {
  securities: SecurityType[];
  disabledSecurities?: SecurityType[];
  security: SecurityType;
  width: string;
  templateForText?: string[];
  templateForOptions?: string[];
  disabled?: boolean;
  loading?: boolean;
  noResultsMessage?: string;
  defaultSort?: keyof SecurityType;
  defaultSortDirection?: "ASC" | "DESC";
  fields?: SecurityField[];
  noHeaders?: boolean;
  maxSecuritiesToShow?: number;
  className?: string;
  placeholder?: string;
  minCharacters?: number;
  clearable?: boolean;
  title?: string;
  errorhighlight?: boolean;
  removeSecurity?: (defaultSecurityId: string) => void;
  setSecurity?: (security: SecurityType, oldSecurity?: SecurityType) => void;
  onSearchClear?: () => void;
  compileTemplate: (securities: (SecurityType | undefined)[], config: TemplateConfig) => string[];
  registerSecuritiesWithProviderMemoized: (securities: SecurityType[], sort: keyof SecurityType, sortDirection: "ASC" | "DESC", config: TemplateConfig, type: TemplateType) => string[];
  onSearchChange?: (e: Event, value: { searchQuery: string }) => void;
  sorter?: (sortField: keyof SecurityType, sortDirection: "ASC" | "DESC") => (a?: SecurityType, b?: SecurityType) => number;
  withinProvider?: boolean;
};

type DropdownState = {
  optionsToRender: Option[];
  openedAt?: Date | null;
  query?: string;
  optionsSortField: keyof SecurityType;
  optionsSortDirection: "ASC" | "DESC";
  header?: React.JSX.Element | null;
  changeSetQueue: ChangeSet[];
  currentAppliedChangeSets: ChangeSet[];
  uuid: string;
  mounted: boolean;
};

type DiffableProperty = Record<keyof Omit<DropdownProps, "noChange" | "fields" |
  "noHeaders" | "maxSecuritiesToShow" | "className" | "placeholder" | "minCharacters" |
  "clearable" | "title" | "errorhighlight" | "removeSecurity" | "setSecurity" |
  "onSearchClear" | "compileTemplate" | "registerSecuritiesWithProviderMemoized" |
  "onSearchChange" | "sorter" | "withinProvider">, DiffableDefinition>;

type DiffableState = Record<keyof Omit<DropdownState, "header" |
  "changeSetQueue" | "currentAppliedChangeSets" | "uuid" | "mounted">, DiffableDefinition>;

type ChangeValue<T> = {
  [K in keyof T]?: T[K];
}

interface ChangeSetItem<T> {
  newValue: ChangeValue<T>;
  oldValue?: ChangeValue<T>;
  __config?: DiffableDefinition;
};

type ChangeSet = {
  name: keyof DropdownProps | keyof DropdownState;
  change?: ChangeSetItem<DropdownProps | DropdownState>;
}

type ApplyMethodsType = {
  [K in (keyof DropdownProps | keyof DropdownState) as `apply_${string & K}Diff`]?: (self: InternalSecuritiesDD, options: Option[], diff?: ChangeSet) => Option[];
}

const applyMethods: ApplyMethodsType = {
  /**
   * if the following conditions each evaluate to `true`, then clear
   * out `options` collection:
   *
   *   1.) `newQuery` is empty
   *   2.) we are within a managed search context
   *   3.) there is not a `security` present
   */
  apply_queryDiff: (self: InternalSecuritiesDD, options: Option[], diff?: ChangeSet) => {
    const { change: { newValue } = {} } = diff ?? {} as ChangeSet;

    const { security } = self.props;

    if (!newValue && self.isManagedSearch && security?.defaultSecurityId == null) {
      options = [];
    }
    return options;
  },

  /**
   * We want to:
   *   1.) remove those options whose securities are not in `newSecurities` and are in `options`
   *   2.) add options for securities who are in `newSecurities` and not represented in `options`
   */
  apply_securitiesDiff: (self: InternalSecuritiesDD, _: Option[], diff?: ChangeSet) => {
    return (diff?.change?.newValue as SecurityType[])?.map((security) => {
      return {
        key: security.defaultSecurityId,
        $security: security,
        $needscompiling: "true",
        $needssorting: self.props.defaultSort ? "true" : "false",
      };
    });
  },

  /**
   * We want to
   *   1.) remove the `disabled` property from any `options` that are marked `disabled` and are not in `newDisabledSecurities`
   *   2.) add the `disabled` property to any `options` that are not marked `disabled` but are in `newDisabledSecurities`
   *     a.) if a security in `newDisabledSecurities` does not exist in `options`, just ignore, that should have been detected
   *         as a `securities` change and handled there
   */
  apply_disabledSecuritiesDiff: (self: InternalSecuritiesDD, options: Option[], diff?: ChangeSet) => {
    const newDisabledSecuritiesIds = (diff?.change?.newValue as SecurityType[])?.map((security) => security.defaultSecurityId);

    options = options.map((option) => {
      const disabled = option.$security?.defaultSecurityId ? newDisabledSecuritiesIds.includes(option.$security.defaultSecurityId) : false;

      // 1.) and 2.)
      if (option.disabled !== disabled) {
        return {
          ...option,
          disabled,
          $needscompiling: "true",
        };
      }
      return option;
    });

    return options;
  },

  /**
   * We want to either
   *   1.) add new security when current is null: if the `newSecurity` does not exist as an option, add it
   *   2.) switch from current security to new security: clear out options if there isn't a `newSecurity` and nor is there an `oldSecurity`
   *   3.) remove current security: mark the option associated with the `newSecurity` as `$needscompiling`
   */
  apply_securityDiff: (self: InternalSecuritiesDD, options: Option[], diff?: ChangeSet) => {
    const {
      securities = [],
    } = self.props;

    options = options.slice();

    // 1.) and 2.)
    if ((diff?.change?.newValue as SecurityType)?.defaultSecurityId) {
      if (
        !options.some((option) => option.$security?.defaultSecurityId === (diff?.change?.newValue as SecurityType)?.defaultSecurityId)
      ) {
        options.unshift({
          key: "emptyOption",
          text: "",
          value: "empty",
          active: true,
          $security: (diff?.change?.newValue as SecurityType),
          $needscompiling: "true",
        });
      }
    } else {
      if (self.isManagedSearch) {
        options = [];
      }
    }
    return options;
  },

  /**
   * the `template` located in `props` applies to and only to
   * the `optionsToRender` collection, but only when the
   * dropdown is closed.
   *
   *   1.) set each option with a property named `needCompiling` and is
   *       equal to `true` in order to indicate that each option within
   *       the collection should be re-built
   */
  apply_templateForTextDiff: (_: InternalSecuritiesDD, options: Option[]) => {
    // 1.)
    options = options.map((option) => {
      return {
        ...option,
        $needscompiling: "true",
      };
    });
    return options;
  },

  /**
   * the `template` located in `props` applies to and only to
   * the `optionsToRender` collection, but only when the
   * dropdown is closed.
   *
   *   1.) set each option with a property named `needCompiling` and is
   *       equal to `true` in order to indicate that each option within
   *       the collection should be re-built
   */
  apply_templateForOptionsDiff: (_: InternalSecuritiesDD, options: Option[]) => {
    // 1.)
    options = options.map((option) => {
      return {
        ...option,
        $needscompiling: "true",
      };
    });
    return options;
  },

  /**
   *
   * @param _
   * @param options
   * @returns
   */
  apply_defaultSortDiff: (_: InternalSecuritiesDD, options: Option[]) => {
    options = options.map((option) => {
      return {
        ...option,
        $needssorting: "true",
      };
    });
    return options;
  },

  /**
   *
   * @param _
   * @param options
   * @returns
   */
  apply_defaultSortDirectionDiff: (_: InternalSecuritiesDD, options: Option[]) => {
    options = options.map((option) => {
      return {
        ...option,
        $needssorting: "true",
      };
    });
    return options;
  },

  /**
   *
   */
  apply_optionsSortFieldDiff: (_: InternalSecuritiesDD, options: Option[]) => {
    options = options.map((option) => {
      return {
        ...option,
        $needssorting: "true",
      };
    });
    return options;
  },

  /**
   *
   */
  apply_optionsSortDirectionDiff: (_: InternalSecuritiesDD, options: Option[]) => {
    options = options.map((option) => {
      return {
        ...option,
        $needssorting: "true",
      };
    });
    return options;
  },
};

export const DIFFABLE_PROPERTIES: DiffableProperty = {
  securities: {
    process: "deferred",
    selectors: ["*.defaultSecurityId"],
    ensureUnique: ensureUniqueSecurities,
    order: 1,
    isDelta: (a: SecurityType[], b: SecurityType[]) => {
      return a?.length !== b?.length || Object.entries(a).sort().toString() !== Object.entries(b).sort().toString();
    },
  },
  disabledSecurities: {
    process: "immediately",
    selectors: ["*.defaultSecurityId"],
    ensureUnique: ensureUniqueSecurities,
    order: 2,
    isDelta: (a: SecurityType[], b: SecurityType[]) => {
      return a?.length !== b?.length || Object.entries(a).sort().toString() !== Object.entries(b).sort().toString();//a?.some(({ defaultSecurityId  }, index) => defaultSecurityId !== b[index].defaultSecurityId);
    },
  },
  security: {
    process: "immediately",
    selectors: ["defaultSecurityId", "nonExistent"],
    order: 3,
    isDelta: (a: SecurityType, b: SecurityType) => a?.defaultSecurityId !== b?.defaultSecurityId,
  },
  width: {
    process: "immediately",
    order: 4,
    isDelta: (a: string[], b: string[]) => {
      return a !== b;
    }
  },
  templateForText: {
    process: "immediately",
    selectors: ["*"],
    order: 5,
    isDelta: (a: string[], b: string[]) => {
      return a?.toString() !== b?.toString();
    }
  },
  templateForOptions: {
    process: "immediately",
    selectors: ["*"],
    order: 5,
    isDelta: (a: string[], b: string[]) => {
      return a?.toString() !== b?.toString();
    }
  },
  disabled: {
    process: "immediately",
    immediateButNotAloneSufficientForRecomputingOptions: true,
    order: 6,
    isDelta: (a: boolean, b: boolean) => {
      return a !== b;
    }
  },
  loading: {
    process: "immediately",
    immediateButNotAloneSufficientForRecomputingOptions: true,
    order: 7,
    isDelta: (a: boolean, b: boolean) => {
      return a !== b;
    }
  },
  noResultsMessage: {
    process: "immediately",
    immediateButNotAloneSufficientForRecomputingOptions: true,
    order: 8,
    isDelta: (a: string, b: string) => {
      return a !== b;
    }
  },
  defaultSort: {
    process: "immediately",
    order: 9,
    isDelta: (a: string, b: string) => {
      return a !== b;
    }
  },
  defaultSortDirection: {
    process: "immediately",
    order: 10,
    isDelta: (a: string, b: string) => {
      return a !== b;
    }
  },
  // TODO: consider adding support for `fields`, `extraFields`, `formatters`, `overflowFieldName` and `overflowFieldIndex`
};

const DIFFABLE_STATE_PROPERTIES: DiffableState = {
  optionsToRender: {
    process: "immediately",
    selectors: ["*.security.defaultSecurityId", "*.template.*", "*.$needscompiling", "*.$needssorting"],
    order: 2,
    isDelta: (a: Option[], b: Option[]) => {
      return Object.entries(a).sort().toString() !== Object.entries(b).sort().toString();
    }
  },
  openedAt: {
    process: "immediately",
    order: 3,
    isDelta: (a: string, b: string) => a !== b
  },
  query: {
    process: "immediately",
    order: 4,
    isDelta: (a: string, b: string) => a !== b
  },
  optionsSortField: {
    process: "immediately",
    order: 5,
    isDelta: (a: string, b: string) => a !== b
  },
  optionsSortDirection: {
    process: "immediately",
    order: 6,
    isDelta: (a: string, b: string) => a !== b
  },
};

const searchKeywordGenerator = (security: SecurityType) => {
  return SECURITY_SEARCH_KEYWORD_PROPERTIES.reduce(
    (acc, { field, type, shouldCheck }) => {
      const value = security[field];
      const { formatter } = SECURITY_COLUMNS_MAP[field] || {
        formatter: (value) => value,
      };
      acc.push({
        keyword: formatAsString(formatter, value, security),
        type,
        shouldCheck,
      });
      return acc;
    },
    [] as KeyWordType[]
  ).filter(({ keyword }) => !!keyword);
};

const moveDisabledToTheBottomComparator = (a: Option, b: Option) => {
  if (a.disabled && !b.disabled) {
    return 1;
  } else if (!a.disabled && b.disabled) {
    return -1;
  }
  return 0;
};

const noop = () => [] as string[];

const computeChangeSetProps = memoComputeChangeProps((
  newData: DropdownProps,
  oldData: Partial<DropdownProps>,
  configMap: DiffableProperty
) => {
  return !configMap ? [] as ChangeSet[] :
    Object.entries(newData).concat(Object.entries(oldData))
      .map((entry) => entry[0])
      .reduce((acc, property: string) => {
        const dropdownProp = property as keyof DiffableProperty;
        if (!(dropdownProp in configMap)) {
          return acc;
        }

        let newValue = newData[dropdownProp as keyof DropdownProps];
        let oldValue = oldData[dropdownProp as keyof DropdownProps];
        const config = configMap[dropdownProp];

        if (config?.ensureUnique && Array.isArray(newValue) && Array.isArray(oldValue)) {
          newValue = config?.ensureUnique(newValue as SecurityType[], {}) ?? [];
          oldValue = config?.ensureUnique(oldValue as SecurityType[], {}) ?? [];
        }

        if (config?.isDelta?.(newValue, oldValue)) {
          acc.unshift({
            name: dropdownProp,
            change: {
              newValue: newValue as ChangeValue<DropdownProps>,
              oldValue: oldValue as ChangeValue<DropdownProps>,
              __config: config,
            },
          });
        }
        return acc;
      }, [] as ChangeSet[]);
});

const computeChangeSetState = memoComputeChangeState((
  newData: Partial<DropdownState>,
  oldData: DropdownState,
  configMap: DiffableState
) => {
  return !configMap ? [] as ChangeSet[] :
    Object.entries(newData).concat(Object.entries(oldData))
      .map((entry) => entry[0])
      .reduce((acc, property: string) => {
        const dropdownStateProp = property as keyof DiffableState;

        if (!(dropdownStateProp in configMap)) {
          return acc;
        }

        if (configMap[dropdownStateProp].isDelta?.(newData[dropdownStateProp], oldData[dropdownStateProp])) {
          acc.unshift({
            name: dropdownStateProp,
            change: {
              newValue: newData[dropdownStateProp] as ChangeValue<DropdownState>,
              oldValue: oldData[dropdownStateProp] as ChangeValue<DropdownState>,
              __config: configMap[dropdownStateProp],
            },
          });
        }
        return acc;
      }, [] as ChangeSet[]);
});

const composeCompileConfiguration = (instance: InternalSecuritiesDD, forceNoHeaders = false, contain = false, uuid: string) => {
  const { securities = [], width, fields = SECURITY_COLUMNS, noHeaders } = instance.props;

  return {
    securities,
    width,
    fields,
    showHeaders: !noHeaders && !forceNoHeaders,
    contain,
    node: (instance.dropdownRef as any)?.current?.searchRef?.current,
    uuid,
  };
};

const needsCompile = (options: Option[] = []) => {
  return options.some((option) => option.$needscompiling === "true");
};

const needsSort = (options: Option[] = []) => {
  return options.some((option) => option.$needssorting === "true");
};

class InternalSecuritiesDD extends React.Component<DropdownProps, DropdownState> {
  dropdownRef: React.LegacyRef<React.Component<DropdownProps, DropdownState, any>> | undefined;
  static cachedProps: Record<string, Partial<DropdownProps>> = {};

  constructor(props: DropdownProps) {
    super(props);

    for(const key in applyMethods) {
      applyMethods[key as keyof ApplyMethodsType]?.bind(this);
    }

    this.dropdownRef = React.createRef();
    const uuid = uuidv1();

    this.state = {
      optionsToRender: [],
      optionsSortField: "defaultSecurityId",
      optionsSortDirection: "ASC",
      changeSetQueue: [],
      currentAppliedChangeSets: [],
      uuid: uuid,
      mounted: false
    };

    InternalSecuritiesDD.cachedProps[uuid] = props;
  }

  get isManagedSearch() {
    return this.props.onSearchChange != null;
  }

  get isOpen() {
    return this.state.openedAt != null;
  }

  get isClosed() {
    return this.state.openedAt == null;
  }

  componentDidMount() {
    const {
      security,
      securities = [],
      disabledSecurities = [],
    } = this.props;

    let optionsToRender = this.switchSecurity(security);
    this.setState({ optionsToRender, mounted: true });

    if (security?.defaultSecurityId === disabledSecurities?.[0]?.defaultSecurityId) {
      const self = this;
      requestAnimationFrame(() => {
        self.renderAllSecuritiesOptions();
      });
    }
  }

  switchSecurity(security?: SecurityType) {
    const {
      noHeaders,
      registerSecuritiesWithProviderMemoized = noop,
    } = this.props;

    const templateForText = registerSecuritiesWithProviderMemoized(
      security ? [security] : [],
      this.state.optionsSortField,
      this.state.optionsSortDirection,
      composeCompileConfiguration(this, true, true, this.state.uuid),
      TemplateType.TEXT
    );
    const templateForOptions = registerSecuritiesWithProviderMemoized(
      security ? [security] : [],
      this.state.optionsSortField,
      this.state.optionsSortDirection,
      composeCompileConfiguration(this, noHeaders, false, this.state.uuid),
      TemplateType.OPTIONS
    );

    const optionsToRender = security
      ? [
          this.createSingularOption(
            security,
            {
              key: security.defaultSecurityId,
              $security: security
            },
            templateForText,
            templateForOptions,
            true
          )
        ]
      : [];

    return optionsToRender;
  };

  /**
   *
   * @returns
   */
  renderAllSecuritiesOptions() {
    const {
      disabledSecurities = [],
      securities,
      noHeaders,
      registerSecuritiesWithProviderMemoized = noop,
    } = this.props;

    const templateForText = registerSecuritiesWithProviderMemoized(
      disabledSecurities,
      this.state.optionsSortField,
      this.state.optionsSortDirection,
      composeCompileConfiguration(this, true, true, this.state.uuid),
      TemplateType.TEXT
    );
    const templateForOptions = registerSecuritiesWithProviderMemoized(
      securities,
      this.state.optionsSortField,
      this.state.optionsSortDirection,
      composeCompileConfiguration(this, noHeaders, false, this.state.uuid),
      TemplateType.OPTIONS,
    );

    const optionsToRender = securities?.map((security) => {
      return this.createSingularOption(
        security,
        {
          key: security.defaultSecurityId,
          $security: security
        },
        templateForOptions,
        templateForOptions,
        false
      );
    }) ?? [];

    if (optionsToRender.some((option) => option.disabled)) {
      optionsToRender.sort(moveDisabledToTheBottomComparator);
    }

    return optionsToRender;
  }

  /**
   *
   * @param nextProps
   * @param prevState
   * @returns
   */
  static getDerivedStateFromProps(nextProps: DropdownProps, prevState: DropdownState) {
    if (!prevState.mounted) {
      return null;
    }

    const propsChangeSet = computeChangeSetProps(
      nextProps,
      InternalSecuritiesDD.cachedProps[prevState.uuid] as Partial<DropdownProps>,
      DIFFABLE_PROPERTIES
    );
    const changeSetQueue = prevState.changeSetQueue.slice();
    const newChangeSetQueueFromProps = propsChangeSet
      .reduce(
        (acc, diff: ChangeSet) => {
          if (
            !prevState.currentAppliedChangeSets.some((changeSet: ChangeSet) =>
              diff.name === changeSet.name && !diff.change?.__config?.isDelta?.(diff.change?.newValue, changeSet.change?.newValue)) &&
            !changeSetQueue.some((changeSet: ChangeSet) =>
              diff.name === changeSet.name && !diff.change?.__config?.isDelta?.(diff.change?.newValue, changeSet.change?.newValue)) &&
            !acc.some((changeSet: ChangeSet) =>
              diff.name === changeSet.name && !diff.change?.__config?.isDelta?.(diff.change?.newValue, changeSet.change?.newValue))
          ) {
            acc.push(diff);
          }
          return acc;
        },
        [] as ChangeSet[]
      );

    if (newChangeSetQueueFromProps.length) {
      changeSetQueue.push(...newChangeSetQueueFromProps);
      changeSetQueue.sort((a, b) => {
        if (a.change?.__config?.order == null && b.change?.__config?.order == null) {
          return 0;
        } else if (a.change?.__config?.order == null) {
          return 1;
        } else if (b.change?.__config?.order == null) {
          return -1;
        } else {
          return a.change.__config.order - b.change.__config.order;
        }
      });
    }

    const candidateIndex = changeSetQueue.findIndex((changeSet) =>
      changeSet?.change?.__config?.process === "immediately"
    );

    if (candidateIndex > -1) {
      return {
        changeSetQueue,
      };
    }
    return null;
  }

  componentDidUpdate(_: DropdownProps, prevState: DropdownState) {
    let {
      optionsToRender = [],
      header,
      optionsSortField,
      optionsSortDirection,
    } = this.state;
    const { security, securities, registerSecuritiesWithProviderMemoized = noop, } = this.props;

    let changeSetQueue = this.state.changeSetQueue.slice();
    const currentAppliedChangeSets = this.state.currentAppliedChangeSets.slice();
    const stateChangeSet = computeChangeSetState(this.state, prevState, DIFFABLE_STATE_PROPERTIES);

    const newStateChangeSet = stateChangeSet.reduce(
      (acc, diff: ChangeSet) => {
        if (diff.change?.__config?.process === "immediately") {
          acc.push(diff);
        }
        return acc;
      },
      [] as ChangeSet[]
    )

    changeSetQueue.push(...newStateChangeSet);

    const [toProcess, deferred] = changeSetQueue.reduce((acc, changeSet) => {
      if (changeSet?.change?.__config?.process === "immediately") {
        acc[0].push(changeSet);
      } else {
        acc[1].push(changeSet);
      }
      return acc;
    }, [[] as ChangeSet[], [] as ChangeSet[]] as ChangeSet[][]);

    changeSetQueue = deferred.length ? deferred : [];

    if (toProcess.length > 0) {
      for (const changeSet of toProcess) {
        const currentIndex = currentAppliedChangeSets.findIndex((diff) => diff.name === changeSet.name);
        if (currentIndex > -1) {
          currentAppliedChangeSets.splice(currentIndex, 1);
        }
      }
      currentAppliedChangeSets.push(...toProcess);

      let { templateForText, templateForOptions } = this.props;
      const {
        fields = SECURITY_COLUMNS,
        noHeaders,
        width = "600px",
        defaultSort,
        defaultSortDirection,
      } = this.props;

      if (this.isOpen) {
        optionsToRender = this.renderAllSecuritiesOptions();
        optionsToRender = this.applyChangeSetsQueueOntoOptions(toProcess.slice(), optionsToRender);
        const doCompile = needsCompile(optionsToRender);
        const addSortHeader = !noHeaders && (needsSort(optionsToRender) || header == null || doCompile);

        if (doCompile || addSortHeader) {
          templateForOptions = this.props.compileTemplate(
            optionsToRender.map((o) => o.$security) as SecurityType[],
            composeCompileConfiguration(this, noHeaders, false, this.state.uuid)
          );
          optionsToRender = this.recompileOptions(optionsToRender, templateForOptions ?? [], templateForOptions ?? [], true, false);

          if (addSortHeader) {
            if (doCompile) {
              optionsSortField = defaultSort ?? "defaultSecurityId";
              optionsSortDirection = defaultSortDirection || "ASC";
            }

            header = (
              <StyledDynamicHeader
                template={templateForOptions}
                fields={fields}
                sort={optionsSortField}
                direction={optionsSortDirection || "ASC"}
                onClick={this.sortItems}
              />
            );
          }
        }
        optionsToRender = this.recompileOptions(optionsToRender, templateForOptions ?? [], templateForOptions ?? [], false, false);

        if (needsSort(optionsToRender)) {
          const securitySorter = (this.props.sorter || sorter)(
            this.state.optionsSortField,
            this.state.optionsSortDirection
          );
          optionsToRender.sort((a: Option, b: Option) => {
            const compare = moveDisabledToTheBottomComparator(a, b);
            if (compare === 0) {
              return securitySorter(a.$security, b.$security) ?? 0;
            }
            return compare ?? 0;
          });
          optionsToRender = optionsToRender.map((option) => {
            const cloned = { ...option };
            delete cloned.$needssorting;
            return cloned;
          });
        }

        this.setState({
          optionsToRender,
          header,
          optionsSortField,
          optionsSortDirection,
          changeSetQueue,
          currentAppliedChangeSets,
        });
      } else {
        const securityChangeSet = toProcess.find((diff) => diff.name === "security");
        if (securityChangeSet && securityChangeSet.change?.newValue != null) {
          optionsToRender = this.switchSecurity(securityChangeSet.change.newValue as SecurityType);
          this.setState({ optionsToRender });
        }

        const self = this;
        requestAnimationFrame(() => {
          optionsToRender = self.applyChangeSetsQueueOntoOptions(toProcess.slice(), optionsToRender);

          templateForText = registerSecuritiesWithProviderMemoized(
            self.props.disabledSecurities ?? [],
            this.state.optionsSortField,
            this.state.optionsSortDirection,
            composeCompileConfiguration(self, true, true, self.state.uuid),
            TemplateType.TEXT
          );
          templateForOptions = registerSecuritiesWithProviderMemoized(
            securities,
            this.state.optionsSortField,
            this.state.optionsSortDirection,
            composeCompileConfiguration(self, noHeaders, false, self.state.uuid),
            TemplateType.OPTIONS
          );

          optionsToRender = security?.defaultSecurityId ? optionsToRender
            .map((option) => ({
              ...option,
              $needscompiling: "true",
            })) : optionsToRender;

          optionsToRender = self.recompileOptions(optionsToRender, templateForText ?? [], templateForText ?? [], false, true);

          self.setState({
            optionsToRender,
            header,
            optionsSortField,
            optionsSortDirection,
            changeSetQueue,
            currentAppliedChangeSets,
          });
        });
      }
    }
  }

  /**
   *
   */
  sortItems = (field: SecurityField) => {
    const optionsSortDirection = this.state.optionsSortDirection === "DESC" ? "ASC" : "DESC";

    this.setState({
      optionsSortField: field.field as keyof SecurityType,
      optionsSortDirection,
    });
  };

  /**
   * Creates an `option` object for the`DropDown` instance
   */
  createSingularOption = (security: SecurityType, option: Option, templateForText: string[], templateForOptions: string[], emptyAble: boolean) => {
    const { security: selectedSecurity } = this.props;

    const securityProps: SecurityComponentProps = {
      security,
      template: [],
      fields: this.props.fields ?? SECURITY_COLUMNS,
      emptyAble
    };

    const keywords = searchKeywordGenerator(security);
    const text = <Security key={`${security.defaultSecurityId}-text`} {...{...securityProps, template: templateForText, width: this.props.width, }} />;
    const content = <Security key={`${security.defaultSecurityId}-security`} {...{...securityProps, template: templateForOptions }} />;
    const { defaultSecurityId: value, name } = security;
    const { disabledSecurities = [] } = this.props;
    const disabled =
      selectedSecurity?.defaultSecurityId !== security?.defaultSecurityId &&
      disabledSecurities.some((disabledSecurity) => disabledSecurity.defaultSecurityId === security.defaultSecurityId);

    return {
      key: `${security.defaultSecurityId}-item`,
      value,
      text,
      content,
      name,
      disabled,
      $keywords: keywords,
      $security: security,
      $templateForText: templateForText,
      $templateForOptions: templateForOptions,
      $needssorting: option.$needssorting,
    };
  };

  /**
   * Process only the changes found within each changeSet type, resulting in a minimal
   * set of overall changes to the `options` collection.
   *
   * NOTE: that the `options` collection is NOT intended to be mutated here; a new collection should
   * be returned from each handler at the end of its operation.
   *
   * Algorithm:
   *   For each changeSet type within the `changeSet` data structure, we will call its respective
   *   change type handler. Each change type handler must produce a new `options` collection
   *   representing only the most minimal set of changes to the collection as possible by
   *   either removing an option if it is deemed to no longer be a resident of the collection, or
   *   by marking the changed option as `$needscompiling` to indicate that it should be
   *   regenerated.
   */
  applySingularChangeSetOntoOptions = (diff?: ChangeSet, options: Option[] = []) => {
    if (diff) {
      if (diff.change?.__config?.doNotApplyDirectly) {
        return options;
      }

      const name: keyof DiffableProperty | keyof DiffableState = (diff.change?.__config?.name as keyof DiffableProperty | keyof DiffableState) || diff.name;
      const methodKey = `apply_${name}Diff`;
      const applyDiff = applyMethods[methodKey as keyof typeof applyMethods];
      if (applyDiff) {
        options = applyDiff.call(this, this, options, diff);
      }
    }
    return options;
  };

  /**
   * process through this change set queue, and apply each, in order, over the options collection
   * */
  applyChangeSetsQueueOntoOptions = (changeSets: ChangeSet[] = [], options: Option[] = []) => {
    while (changeSets.length) {
      options = this.applySingularChangeSetOntoOptions(changeSets.pop(), options.slice());
    }
    return options.slice();
  };

  /**
   * for all options with a `$needscompiling` flag set to `true`,
   * create a new option object for each.
   */
  recompileOptions = (options: Option[] = [], templateForText: string[], templateForOptions: string[], preventTruncate = false, emptyAble: boolean) => {
    const { security, maxSecuritiesToShow = 50 } = this.props;
    options = options.slice();

    // hoist the currently selected `security` to the top
    if (security?.defaultSecurityId) {
      const index = options.findIndex((option) => option.$security?.defaultSecurityId === security.defaultSecurityId);

      if (index > 0) {
        const [toBeFirst] = options.splice(index, 1);
        options.unshift(toBeFirst);
      }
    }

    // truncate the list if its too long
    if (!preventTruncate && options.length > maxSecuritiesToShow) {
      options = options.slice(0, maxSecuritiesToShow);
      options.push({
        key: "refineFilter",
        disabled: true,
        value: "empty",
        text: <b>Please further refine filter; results are truncated</b>,
        $security: security,
        $templateForText: templateForText,
        $templateForOptions: templateForOptions,
        $keywords: [] as KeyWordType[],
      });
    }

    if (needsCompile(options)) {
      options = options.map((option) => {
        if (option.$security && (option.$needscompiling === "true" || option.$security.defaultSecurityId)) {
          return this.createSingularOption(option.$security, option, templateForText, templateForOptions, emptyAble);
        }

        return option;
      });

      if (options.some((option) => option.disabled)) {
        options.sort(moveDisabledToTheBottomComparator);
      }
    }

    return options.slice();
  };

  /**
   * fires either when a security is selected or when one is removed via the clear button
   */
  onChange = (_: unknown, { value }: { value: string; }) => {
    const {
      securities = [],
      security: oldSecurity,
      setSecurity = noop,
      removeSecurity = noop,
      onSearchClear = noop,
    } = this.props;

    if (value) {
      const changedToSecurity = securities.find((security) => security.defaultSecurityId === value);

      if (changedToSecurity) {
        // const optionsToRender = this.switchSecurity(changedToSecurity);
        // this.setState({ optionsToRender });

        requestAnimationFrame(() => setSecurity(changedToSecurity, oldSecurity));
      } else {
        console.warn(
          `failed switching to security '${value}', we could not find it within the current rendered collection`
        );
      }
    } else if (oldSecurity?.defaultSecurityId) {
      const optionsToRender = this.switchSecurity();
      this.setState({ optionsToRender });

      requestAnimationFrame(() => removeSecurity(oldSecurity.defaultSecurityId));
      onSearchClear();
    }
  };

  /**
   * fires when text is either entered or removed from the search input
   */
  onSearchChange = (e: Event, value: { searchQuery: string }) => {
    const {
      security,
      minCharacters = 1,
      onSearchChange: propsOnSearchChange = noop,
      removeSecurity = noop,
      onSearchClear = noop,
    } = this.props;

    if (value.searchQuery.length >= minCharacters) {
      if (this.isManagedSearch) {
        const querySet = [(e.target as HTMLOptionElement)?.value, value.searchQuery];
        querySet.sort((a, b) => a.length - b.length);
        const [first, second] = querySet;

        if (second.indexOf(first) !== 0) {
          // is a totally new term, not just an addition or subtraction
          if (security?.defaultSecurityId) {
            removeSecurity(security.defaultSecurityId);
          }

          onSearchClear();

          this.setState({
            optionsToRender: [],
            query: value.searchQuery,
          });
        } else {
          this.setState({
            query: value.searchQuery,
          });
        }
      }

      propsOnSearchChange(e, value);
    }
  };

  /**
   *
   * @param options
   * @param query
   * @returns
   */
  customSearch = (options: Option[], query: string) => {
    return search(query, this.isManagedSearch ? options : this.state.optionsToRender);
  };

  /**
   * useful for key navigation that is managed by `KeyNavProvider`
   */
  onKeyDown = (e: KeyboardEvent) => {
    if (/ArrowUp|ArrowDown/.test(e.key)) {
      e.stopPropagation();
      e.preventDefault();
      return;
    }
  };

  /**
   * update state to indicate that the dropdown is currently `open`
   */
  onOpen = () => {
    this.setState({ openedAt: new Date() });
  };

  /**
   * update state to indicate that the dropdown is currently `closed`
   */
  onClose = () => {
    const self = this;
    requestAnimationFrame(() => self.setState({ openedAt: null }));
  };

  render() {
    const {
      disabled,
      className,
      placeholder = "Securities...",
      minCharacters,
      security,
      noResultsMessage = "No Securities Found",
      loading,
      clearable,
      title,
      errorhighlight,
    } = this.props;

    const { optionsToRender = [] } = this.state;
    let { header } = this.state;

    if (optionsToRender.length === 0) {
      header = null;
    }

    return (
      <StyledDropdown
        key={`${security?.defaultSecurityId}-dropdown`}
        errorhighlight={errorhighlight}
        selection
        selectOnNavigation={false /* don't fire onChange() on keyboard navigation */}
        selectOnBlur={false}
        openOnFocus={false}
        icon="search"
        data-uuid={this.state.uuid}
        ref={this.dropdownRef as any}
        onOpen={this.onOpen}
        onClose={this.onClose}
        onKeyDown={this.onKeyDown}
        onChange={this.onChange}
        onSearchChange={this.onSearchChange}
        search={this.customSearch}
        header={header}
        disabled={disabled}
        className={className}
        placeholder={placeholder || "Securities..."}
        minCharacters={minCharacters}
        noResultsMessage={noResultsMessage}
        loading={loading}
        clearable={clearable}
        title={title}
        text={security?.defaultSecurityId ? null : "Securities..."}
        value={security?.defaultSecurityId || ''}
        options={optionsToRender.map((o) => {
          return {
            value: o.value,
            text: o.text,
            active: o.active,
            disabled: o.disabled,
            key: o.key,
          }
        })}
      />
    );
  }
}

export default InternalSecuritiesDD;
