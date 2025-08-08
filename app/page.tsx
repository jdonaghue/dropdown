"use client"

import React, { createRef, useEffect, useLayoutEffect, useState } from "react";
import numeral from "numeral";

import { SECURITY_COLUMNS } from "@/packages/components/dropdown/security";
import { Security } from "@/packages/types/types";
import SecuritiesDD from "@/packages/components/dropdown";
import SecuritiesDDProvider from "@/packages/components/dropdown/provider";
import securities from "../securities.json";
import DynamicHeader from "@/packages/components/dropdown/dynamic_header";
import SecuritiesDDConsumer from "@/packages/components/dropdown/consumer";
import styled from "styled-components";

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
  hideOnOverflow: 1,
  exists: () => true,
});

const StyledDynamicHeader = styled(DynamicHeader)`
  font-weight: bold;
  white-space: nowrap;
  width: 700px;
  padding: 0.75rem 1.16666667rem !important;
  user-select: none;
  position: sticky;
  top: 0;
  z-index: 99;
  font-size: 14px;

  border: 1px solid grey;
  background: #DDD;

  @media only screen and (max-width: 1028px) {
    & {
      width: 80vw;
      overflow: hidden;
    }
  }

  > div {
    user-select: none;
  }
` as typeof DynamicHeader;

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [width, setWidth] = useState<number>(0);
  const [fontSize, setFontSize] = useState<number>(0);
  const [securitiesCollection, setSecuritiesCollection] = React.useState<Security[]>((securitiesWithMv as unknown as Security[]).slice(0, 100));
  const ref = createRef<HTMLElement>();

  useEffect(() => {
		setMounted(true)
	}, [])

  useLayoutEffect(() => {
    if (ref.current) {
      const input = ref.current.querySelector("input.search")?.nextElementSibling;
      const rect = (input ?? ref.current).getBoundingClientRect();
      const width = rect.width;

      const computed = window.getComputedStyle(input ?? ref.current);
      setFontSize(Number(computed.fontSize.replace("px", "")));
      setWidth(width);
    }
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <>
      <div className="p-[20px] max-[1028px]:text-center flex-col items-center justify-items-center ">
        <h1>A fast, rich and dynamic React Dropdown component</h1>
        <div><a className="text-lg" target="_blank" rel="noopener noreferrer" href="https://github.com/jdonaghue/dropdown">Source on Github</a></div>
        <div><a className="text-lg" target="_blank" rel="noopener noreferrer" href="https://github.com/jdonaghue/dropdown/blob/main/packages/components/dropdown/search.ts">Search implementation on Github</a></div>
      </div>
      <div className="grid grid-rows-[20px_1fr_20px] items-start justify-items-center min-h-screen p-8 pb-20 gap-16 font-[family-name:var(--font-geist-sans)]">
        <main ref={ref} className="flex flex-col gap-8 row-start-2 items-center justify-items-center">
          <SecuritiesDDProvider width={width}>
            <SecuritiesDDConsumer>
              {
                (props) => {
                  console.log("here", props?.width, fontSize);
                  const template = props?.compileTemplate(securitiesCollection, {
                    securities: securitiesWithMv,
                    width: `${props?.width ?? 0}px`,
                    fields,
                    includeHeaders: true,
                    contain: true,
                    uuid: "header",
                    fontSize: `${fontSize}px`,
                  });

                  return (
                    <StyledDynamicHeader
                      fields={fields}
                      onClick={() => true}
                      template={template ?? []}
                    />
                  );
                }
              }
            </SecuritiesDDConsumer>
            {
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
                    noHeaders={false}
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
            }
          </SecuritiesDDProvider>
        </main>
      </div>
    </>
  );
}
