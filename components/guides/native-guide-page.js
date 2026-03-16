"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useNativeAuth } from "@/components/auth/native-auth-provider";

const LOADING_MESSAGE = "Loading this checklist guide.";
const REDIRECT_MESSAGE = "Redirecting to sign in so you can open this guide.";
const ERROR_MESSAGE = "Guide access is unavailable right now. Please try again in a moment.";

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
  const router = useRouter();
  const { status, user, errorMessage } = useNativeAuth();
  const [checkedItems, setCheckedItems] = useState({});

  useEffect(() => {
    if (status === "ready" && !user) {
      router.replace(`/sign-in?next=${pageData.routePath}`);
    }
  }, [pageData.routePath, router, status, user]);

  if (status === "loading") {
    return (
      <main className="container">
        <div className="info-panel signup-page-card">
          <p className="eyebrow">Checklist Guide</p>
          <h2>Loading guide</h2>
          <p className="signup-page-status" aria-live="polite">
            {LOADING_MESSAGE}
          </p>
        </div>
      </main>
    );
  }

  if (status === "error") {
    return (
      <main className="container">
        <div className="info-panel signup-page-card">
          <p className="eyebrow">Checklist Guide</p>
          <h2>Guide access is unavailable</h2>
          <p className="signup-page-status" data-tone="error" aria-live="polite">
            {errorMessage || ERROR_MESSAGE}
          </p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="container">
        <div className="info-panel signup-page-card">
          <p className="eyebrow">Checklist Guide</p>
          <h2>Redirecting to sign in</h2>
          <p className="signup-page-status" aria-live="polite">
            {REDIRECT_MESSAGE}
          </p>
        </div>
      </main>
    );
  }

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
    </main>
  );
}
