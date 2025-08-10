"use client"

import React, { createRef, useEffect, useLayoutEffect, useState } from "react";
import numeral from "numeral";

import { SECURITY_COLUMNS } from "@/packages/components/dropdown/security";
import { Security } from "@/packages/types/types";
import SecuritiesDD from "@/packages/components/dropdown";
import SecuritiesDDProvider, { SecurityContextValue } from "@/packages/components/dropdown/provider";
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
  cursor: default;

  @media only screen and (max-width: 1028px) {
    & {
      width: 80vw;
      overflow: hidden;
    }
  }

  > div {
    user-select: none;
    cursor: default;
  }
` as typeof DynamicHeader;

const Header = (props: {
  fontSize: number;
  securities: Security[];
} & SecurityContextValue) => {
  const [template, setTemplate] = useState<string[] | undefined>();

  useEffect(() => {
    setTemplate(
      props.compileTemplate(props.securities, {
        securities: securitiesWithMv,
        width: `${props?.width ?? 0}px`,
        fields,
        includeHeaders: true,
        contain: true,
        uuid: "header",
        fontSize: `${props.fontSize}px`,
      })
    );
  }, [props.width, props.fontSize, props.securities]);

  if (template == null) {
    return null;
  }

  return (
    <StyledDynamicHeader
      fields={fields}
      template={template}
    />
  );
}

export default function Home() {
  const [width, setWidth] = useState<number>(0);
  const [fontSize, setFontSize] = useState<number>(0);
  const [securitiesCollection, setSecuritiesCollection] = React.useState<Security[]>((securitiesWithMv as unknown as Security[]).slice(0, 100));
  const ref = createRef<HTMLElement>();

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

  return (
    <>
      <div className="p-[20px] max-[1028px]:text-center flex-col items-center justify-items-center ">
        <h1>A fast, rich and dynamic React Dropdown component</h1>
        <div className="mb-[10px]"><b><a className="text-lg" href="#dropdown-container">Skip down to see the dropdowns below!</a></b></div>
        <div><a className="text-lg" target="_blank" rel="noopener noreferrer" href="https://github.com/jdonaghue/dropdown">Source on Github</a></div>
        <div><a className="text-lg" target="_blank" rel="noopener noreferrer" href="https://github.com/jdonaghue/dropdown/blob/main/packages/components/dropdown/search.ts">Search implementation on Github</a></div>
        <div className="mt-8 max-w-[700px]">
          <h3 className="text-center">Things to know:</h3>
          <ul className="text-left w-[80%] ml-[10%] list-none">
            <li className="box-decoration-clone">
              <div className="w-[15px] align-[-webkit-baseline-middle] inline-block">*</div>
              <div className="w-[90%] inline-block align-top">Expanded dropdowns search queries are parsed and tokenized by spaces unless within quotes</div>
            </li>
            <li className="box-decoration-clone">
              <div className="w-[15px] align-[-webkit-baseline-middle] inline-block">*</div>
              <div className="w-[90%] inline-block align-top">The selected securities are disabled within the expanded dropdowns</div>
            </li>
            <li className="box-decoration-clone">
              <div className="w-[15px] align-[-webkit-baseline-middle] inline-block">*</div>
              <div className="w-[90%] inline-block align-top">Notice how <b>fast</b> the dropdowns render and how the column sizing stays in sync across all of the selected securities</div>
            </li>
            <li className="box-decoration-clone">
              <div className="w-[15px] align-[-webkit-baseline-middle] inline-block">*</div>
              <div className="w-[90%] inline-block align-top">There are <b>100 rendered dropdowns</b> on this page initially</div>
            </li>
            <li className="box-decoration-clone">
              <div className="w-[15px] align-[-webkit-baseline-middle] inline-block">*</div>
              <div className="w-[90%] inline-block align-top">There are <b>200 options</b> per dropdown that are rendered</div>
            </li>
            <li className="box-decoration-clone">
              <div className="w-[15px] align-[-webkit-baseline-middle] inline-block">*</div>
              <div className="w-[90%] inline-block align-top">The <b>columns widths</b> for each data point <b>are calculated dynamically</b> and take into account every selected security across all of the dropdowns, columns are hidden and/or truncated depending on the configured priority of the columns underlying datapoint</div>
            </li>
            <li className="box-decoration-clone">
              <div className="w-[15px] align-[-webkit-baseline-middle] inline-block">*</div>
              <div className="w-[90%] inline-block align-top"><b>React contexts</b> are used to keep track of the column widths across dropdowns. They pass these widths directly to the dropdowns which are registered within the context <b>consumers</b>. So the context provider can be put at any point in the component tree as long as it is an ancestor of all the related dropdowns.</div>
            </li>
            <li className="box-decoration-clone">
              <div className="w-[15px] align-[-webkit-baseline-middle] inline-block">*</div>
              <div className="w-[90%] inline-block align-top">Property and state changes within each dropdown are intercepted and a calculation is performed to determine if they should be evaluated <b>immediately</b> or should instead be <b>deferred</b> and processed asynchronously</div>
            </li>
            <li className="box-decoration-clone">
              <div className="w-[15px] align-[-webkit-baseline-middle] inline-block">*</div>
              <div className="w-[90%] inline-block align-top">When a dropdown is opened, any <b>deferred</b> props or state changes that had been queued are processed <b>immediately</b>, but ideally have already been processed asynchronously</div>
            </li>
          </ul>
          <div className="text-center mt-[10px]"><b><a className="text-lg" href="#dropdown-container">Skip down to see the dropdowns below!</a></b></div>

          <h3 className="text-center">Things to try:</h3>
          <ul className="text-left w-[90%] ml-[10%] list-none">
            <li className="box-decoration-clone">
              <div className="w-[15px] align-[-webkit-baseline-middle] inline-block">*</div>
              <div className="w-[90%] inline-block align-top">Expand a dropdown and search on dates, supports various formats, <b>example:</b> <pre className="bg-[#eeeeee] inline">2025-10</pre> <b>or</b> <pre className="bg-[#eeeeee] inline">10/2025</pre></div>
            </li>
            <li className="box-decoration-clone">
              <div className="w-[15px] align-[-webkit-baseline-middle] inline-block">*</div>
              <div className="w-[90%] inline-block align-top">Expand a dropdown and search with quotes to group tokens across spaces, <b>example:</b> <pre className="bg-[#eeeeee] inline">"Kozey - Ja"</pre></div>
            </li>
            <li className="box-decoration-clone">
              <div className="w-[15px] align-[-webkit-baseline-middle] inline-block">*</div>
              <div className="w-[90%] inline-block align-top">Expand a dropdown and search for <pre className="bg-[#eeeeee] inline">"exact"</pre> matches, <b>example:</b> <pre className="bg-[#eeeeee] inline">hmab</pre> <b>or</b> <pre className="bg-[#eeeeee] inline">hm 82.00</pre></div>
            </li>
            <li className="box-decoration-clone">
              <div className="w-[15px] align-[-webkit-baseline-middle] inline-block">*</div>
              <div className="w-[90%] inline-block align-top">Expand a dropdown and search for <pre className="bg-[#eeeeee] inline">"starts-with"</pre> matches, <b>example:</b> <pre className="bg-[#eeeeee] inline">hm</pre> <b>or</b> <pre className="bg-[#eeeeee] inline">hm 8</pre></div>
            </li>
            <li className="box-decoration-clone">
              <div className="w-[15px] align-[-webkit-baseline-middle] inline-block">*</div>
              <div className="w-[90%] inline-block align-top">Expand a dropdown and search for <pre className="bg-[#eeeeee] inline">"contains"</pre> matches, <b>example:</b> <pre className="bg-[#eeeeee] inline">ma</pre> <b>or</b> <pre className="bg-[#eeeeee] inline">hm 2.0</pre></div>
            </li>
            <li className="box-decoration-clone">
              <div className="w-[15px] align-[-webkit-baseline-middle] inline-block">*</div>
              <div className="w-[90%] inline-block align-top">Expand a dropdown and change selected values and watch the column widths recalculate</div>
            </li>
            <li className="box-decoration-clone">
              <div className="w-[15px] align-[-webkit-baseline-middle] inline-block">*</div>
              <div className="w-[90%] inline-block align-top">Delete the securities with larger names and watch the columns recalculate their widths and even watch new columns that wouldn't previously fit appear</div>
            </li>
          </ul>
        </div>
      </div>
      <div id="dropdown-container" className="grid grid-rows-[20px_1fr_20px] items-start justify-items-center min-h-screen p-8 pb-20 gap-16 font-[family-name:var(--font-geist-sans)]">
        <main ref={ref} className="flex flex-col gap-8 items-center justify-items-center">
          <SecuritiesDDProvider width={width}>
            <SecuritiesDDConsumer>
              {
                (props) => {
                  return <Header {...props} templateForText={[]} templateForOptions={[]} fontSize={fontSize} securities={securitiesCollection ?? []} />;
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
