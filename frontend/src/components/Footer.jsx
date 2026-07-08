import { Link } from "react-router-dom";
import { fallbackContactInfo } from "../utils/fallbackContent";
import {
  buildFacebookHref,
  buildInstagramHref,
  buildMailHref,
  buildPhoneHref,
  buildWhatsappHref,
  buildXHref
} from "../utils/contactLinks";
import { pasaliBrand, pasaliCategories } from "../data/pasaliCatalog";

const Footer = ({ contactInfo }) => {
  const resolvedContactInfo = contactInfo || fallbackContactInfo;
  const phoneLink = buildPhoneHref(resolvedContactInfo.phone || "");
  const emailLink = buildMailHref(resolvedContactInfo.email || "");
  const instagramLink = buildInstagramHref(resolvedContactInfo.socialLinks?.instagram || "");
  const facebookLink = buildFacebookHref(resolvedContactInfo.socialLinks?.facebook || "");
  const xLink = buildXHref(resolvedContactInfo.socialLinks?.x || resolvedContactInfo.socialLinks?.twitter || "");
  const whatsappLink = buildWhatsappHref(resolvedContactInfo.socialLinks?.whatsapp || "");
  const pageLinks = [
    { label: "Ana Sayfa", to: "/" },
    { label: "Ürünler", to: "/products" },
    { label: "Hakkımızda", to: "/#hakkimizda" },
    { label: "İletişim", to: "/#iletisim" }
  ];
  const socialLinks = [
    { label: "Instagram", value: resolvedContactInfo.socialLinks?.instagram, href: instagramLink },
    { label: "Facebook", value: resolvedContactInfo.socialLinks?.facebook, href: facebookLink },
    { label: "X", value: resolvedContactInfo.socialLinks?.x || resolvedContactInfo.socialLinks?.twitter, href: xLink }
  ].filter((item) => item.value && item.href);
  const footerGridClassName = socialLinks.length ? "site-footer__inner site-footer__inner--five" : "site-footer__inner site-footer__inner--four";
  const footerMeta = resolvedContactInfo.workingHours || "";

  return (
    <footer className="site-footer" id="iletisim">
      <div className={footerGridClassName}>
        <section className="footer-column footer-column--brand">
          <Link to="/" className="footer-brand" aria-label={pasaliBrand.name}>
            <img src={pasaliBrand.logo} alt={pasaliBrand.name} className="footer-brand__logo" />
            <div className="footer-brand__copy">
              <h3>{pasaliBrand.name}</h3>
              <p>Özenle hazırlanan tatlar, güvenle sunulan lezzetler.</p>
            </div>
          </Link>
        </section>

        <section className="footer-column">
          <h4 className="footer-heading">İLETİŞİM</h4>
          <div className="footer-list">
            {resolvedContactInfo.phone && (
              <div className="footer-item">
                <span className="footer-item__label">Telefon</span>
                {phoneLink ? (
                  <a href={phoneLink} className="footer-link">
                    {resolvedContactInfo.phone}
                  </a>
                ) : (
                  <span className="footer-text">{resolvedContactInfo.phone}</span>
                )}
              </div>
            )}
            {resolvedContactInfo.socialLinks?.whatsapp && (
              <div className="footer-item">
                <span className="footer-item__label">WhatsApp</span>
                {whatsappLink ? (
                  <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="footer-link">
                    {resolvedContactInfo.socialLinks?.whatsapp}
                  </a>
                ) : (
                  <span className="footer-text">{resolvedContactInfo.socialLinks?.whatsapp}</span>
                )}
              </div>
            )}
            {resolvedContactInfo.email && (
              <div className="footer-item">
                <span className="footer-item__label">E-posta</span>
                {emailLink ? (
                  <a href={emailLink} className="footer-link">
                    {resolvedContactInfo.email}
                  </a>
                ) : (
                  <span className="footer-text">{resolvedContactInfo.email}</span>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="footer-column">
          <h4 className="footer-heading">SAYFALAR</h4>
          <nav className="footer-list" aria-label="Footer sayfa bağlantıları">
            {pageLinks.map((item) => (
              <Link key={item.label} to={item.to} className="footer-link">
                {item.label}
              </Link>
            ))}
          </nav>
        </section>

        <section className="footer-column">
          <h4 className="footer-heading">KATEGORİLER</h4>
          <nav className="footer-list footer-list--categories" aria-label="Footer kategori bağlantıları">
            {pasaliCategories.map((category) => (
              <Link
                key={category._id}
                to={`/products?${new URLSearchParams({ category: category.name }).toString()}`}
                className="footer-link"
              >
                {category.name}
              </Link>
            ))}
          </nav>
        </section>

        {socialLinks.length > 0 && (
          <section className="footer-column">
            <h4 className="footer-heading">SOSYAL MEDYA</h4>
            <div className="footer-list">
              {socialLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-link"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </section>
        )}

        <div className="site-footer__bottom">
          <span>{pasaliBrand.name}</span>
          {footerMeta ? <span>{footerMeta}</span> : <span>Kurumsal ürün kataloğu ve sipariş deneyimi</span>}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
