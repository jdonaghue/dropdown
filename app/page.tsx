"use client"

import React from "react";
import numeral from "numeral";

import { SECURITY_COLUMNS } from "@/packages/components/dropdown/security";
import { Security } from "@/packages/types/types";
import SecuritiesDD from "@/packages/components/dropdown";
import SecuritiesDDProvider from "@/packages/components/dropdown/provider";
import securities from "../securities.json";


const securitiesWithMv = (securities as unknown as Security[])
  .map((sec) => {
    const accts = sec.numAccounts || "";
    const mv = numeral(sec.mv || Math.random()).format("0,0a").toUpperCase();
    return {
      ...sec,
      acctAndMv: `${accts} Accts, $${mv}`,
    };
  });

const fields = SECURITY_COLUMNS.concat({
  field: "acctAndMv",
  header: "Acct and Mv",
  hideOnOverflow: true,
  exists: () => true,
});

export default function Home() {
  const [securitiesCollection, setSecuritiesCollection] = React.useState<Security[]>((securitiesWithMv as unknown as Security[]).slice(0, 87));

  return (
    <>
      <div className="p-[20px] max-[1028px]:text-center flex-col items-center justify-items-center ">
        <h1>A fast, rich and dynamic React Dropdown component</h1>
        <div><a className="text-lg" target="_blank" rel="noopener noreferrer" href="https://github.com/jdonaghue/dropdown">Source on Github</a></div>
        <div><a className="text-lg" target="_blank" rel="noopener noreferrer" href="https://github.com/jdonaghue/dropdown/blob/main/packages/components/dropdown/search.ts">Search implementation on Github</a></div>
      </div>
      <div className="grid grid-rows-[20px_1fr_20px] items-start justify-items-center min-h-screen p-8 pb-20 gap-16 font-[family-name:var(--font-geist-sans)]">
        <main className="flex flex-col gap-8 row-start-2 items-center justify-items-center">
          <SecuritiesDDProvider>{
            securitiesCollection.concat([{} as Security]).map((security) => {
              return (
                <SecuritiesDD
                  key={security?.defaultSecurityId ?? "empty"}
                  className="security-dropdown"
                  securities={securitiesWithMv}
                  disabledSecurities={securitiesCollection as unknown as Security[]}
                  security={security ?? null}
                  width="700px"
                  withinProvider
                  clearable
                  fields={fields}
                  compileTemplate={() => []}
                  registerSecuritiesWithProviderMemoized={() => []}
                  maxSecuritiesToShow={securities.length}
                  removeSecurity={(securityId: string) => {
                    const clone = securitiesCollection.slice();
                    const index = clone.findIndex(
                      (security) => security.defaultSecurityId === securityId
                    );
                    if (index > -1) {
                      clone.splice(index, 1);
                      setSecuritiesCollection(clone);
                    }
                  }}
                  setSecurity={(newSecurity: Security, oldSecurity?: Security) => {
                    const clone = securitiesCollection.slice();
                    const index = clone.findIndex(
                      (security) => security.defaultSecurityId === oldSecurity?.defaultSecurityId
                    );
                    if (index > -1) {
                      clone.splice(index, 1, newSecurity);
                    } else {
                      clone.push(newSecurity);
                    }

                    setSecuritiesCollection(clone);
                  }}
                />
              )
            })
          }</SecuritiesDDProvider>
        </main>
      </div>
    </>
  );
}
