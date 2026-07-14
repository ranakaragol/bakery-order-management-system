import { useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { mergeSiteContent } from "../../utils/fallbackContent";

const splitParagraphs = (value = "") =>
  value
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

const AboutPage = () => {
  const outletContext = useOutletContext();
  const content = mergeSiteContent(outletContext?.contactInfo);

  const paragraphs = useMemo(
    () => ({
      tr: splitParagraphs(content.aboutContent?.bodyTr),
      en: splitParagraphs(content.aboutContent?.bodyEn)
    }),
    [content.aboutContent?.bodyEn, content.aboutContent?.bodyTr]
  );

  return (
    <section className="stack-lg">
      <article className="panel about-page">
        <div className="about-page__section">
          <h2>{content.aboutContent?.titleTr}</h2>
          {paragraphs.tr.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <div className="about-page__section">
          <h2>{content.aboutContent?.titleEn}</h2>
          {paragraphs.en.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </article>
    </section>
  );
};

export default AboutPage;
