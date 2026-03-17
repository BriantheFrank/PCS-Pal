"use client";

import Link from "next/link";
import { useState } from "react";

const isExternalHref = (href) => /^https?:\/\//i.test(String(href || ""));

function GuideLink({ href, children }) {
  if (isExternalHref(href)) {
    return (
      <a className="text-link" href={href} target="_blank" rel="noreferrer">
        {children}
      </a>
    );
  }

  return (
    <Link className="text-link" href={href}>
      {children}
    </Link>
  );
}

export function NativeGuidePage({ pageData }) {
  const [checkedItems, setCheckedItems] = useState({});

  return (
    <main className="container">
      {pageData.sections.map((section) => {
        if (section.type === "intro") {
          return (
            <section className="checklist-section" key={section.id}>
              <h2>{section.title}</h2>
              <p className="checklist-intro">{section.intro}</p>
            </section>
          );
        }

        if (section.type === "checklist") {
          return (
            <section className="checklist-section" key={section.id}>
              <h2>{section.title}</h2>
              <div className="checklist-section-body">
                {section.items.map((item) => (
                  <div
                    className={`checklist-item${checkedItems[item.id] ? " is-complete" : ""}`}
                    key={item.id}
                  >
                    <label>
                      <input
                        type="checkbox"
                        checked={Boolean(checkedItems[item.id])}
                        onChange={(event) =>
                          setCheckedItems((current) => ({
                            ...current,
                            [item.id]: event.target.checked,
                          }))
                        }
                      />
                      <span className="item-title">{item.title}</span>
                    </label>
                    <p
                      className="item-help"
                      dangerouslySetInnerHTML={{ __html: item.helpHtml }}
                    />
                  </div>
                ))}
              </div>
            </section>
          );
        }

        if (section.type === "link-groups") {
          return (
            <section className="checklist-section" key={section.id}>
              <h2>{section.title}</h2>
              <div className="checklist-section-body">
                {section.groups.map((group) => (
                  <div key={group.id}>
                    <h3>{group.title}</h3>
                    <ul className="recommended-list">
                      {group.links.map((link) => (
                        <li key={`${group.id}-${link.href}`}>
                          <GuideLink href={link.href}>{link.label}</GuideLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          );
        }

        return (
          <section className="checklist-section" key={section.id}>
            <h2>{section.title}</h2>
            <ul className="recommended-list">
              {section.items.map((item, index) => (
                <li key={`${section.id}-${index}`} dangerouslySetInnerHTML={{ __html: item }} />
              ))}
            </ul>
          </section>
        );
      })}

      <section className="checklist-section">
        <h2>Related PCS planning pages</h2>
        <div className="card-grid">
          <Link className="nav-card" href="/military-pcs-checklist">
            <h3>Military PCS checklist guide</h3>
            <p>Return to the broader PCS checklist workflow and open the next planning step.</p>
            <span className="card-link">Open checklist guide</span>
          </Link>
          <Link className="nav-card" href="/how-to-plan-a-military-pcs-move">
            <h3>How to plan a military PCS move</h3>
            <p>See how this checklist step fits into inventory, logistics, and destination research.</p>
            <span className="card-link">Open the planning guide</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
