export type Security = {
  betaValue: string;
  defaultSecurityId: string;
  securityId: string;
  name: string;
  beta: string;
  action: string;
  issuerCode: string;
  issuerName: string;
  isEquity: boolean;
  hasEquities: boolean;
  isMunicipal: boolean;
  hasMunicipals: boolean;
  isDuplicate: boolean;
  hasDuplicates: boolean;
  moodyRating: string;
  price: number;
  currencyCode: string;
  spread: number;
  maturityDate: string;
  bookCloseDate: string;
  rule144a: string;
  regS: string;
  rule144aStatus: string;
  bbShortName: string;
  coupon: number;
  assetBacked: boolean;
  industryLevelOneCode: string;
  isSynthetic: boolean;
  acctAndMv?: string;
  numAccounts?: number;
  mv?: number;

  NimCoupon?: string;
  id?: string;
  NimMinTradeSize?: number;
  dirtyPrice?: number;
  couponType?: string;
  natixis?: string;
  NimMoodyRating?: string;
  lotSize?: number;
  researchNoteId?: string;
  NimCurrencyCode?: string;
  crdSecurityId?: string;
  msaaBreakout?: string;
  securityName?: string;
  instrumentType?: string;
  in2IssuerName?: string;
  is144a?: boolean;
  securitySource?: string;
  wal?: number;
  NimIssuerCode?: string;
  securitizedInstrument?: string;
  deskLabel?: string;
  NimMaturityDate?: string;
  allowedOnTrades?: string;
  NimLotSize?: number;
  isHY?: boolean;
  isABS?: boolean;
  format?: string;
  minTradeSize?: number;
  calculationUnit?: number;
  securityIdentifiers?: string;
  childSecurityIdentifiers?: string;
};

export type BasicPropertyValueType = number &
  string &
  boolean &
  null &
  undefined;

export type Sortable = {
  sort: boolean;
  direction: "ASC" | "DESC";
};

export type WithWidth = {
  width: string;
  $template: string[];
};

export type KeyWordType = {
  keyword: string;
  type: "string" | "date" | "float";
  shouldCheck: (value: string) => boolean;
};

export type Option = {
  key: string;
  text?: string | React.JSX.Element;
  value?: string;
  $security?: Security;
  disabled?: boolean;
  $keywords?: KeyWordType[];
  active?: boolean;
  $templateForText?: string[];
  $templateForOptions?: string[];
  $needscompiling?: string;
  $needssorting?: string;
};
