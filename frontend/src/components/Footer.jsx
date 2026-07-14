import { Link } from "react-router-dom";
import { mergeSiteContent } from "../utils/fallbackContent";
import {
  buildFacebookHref,
  buildInstagramHref,
  buildMailHref,
  buildPhoneHref,
  buildWhatsappHref,
  buildXHref
} from "../utils/contactLinks";
import { pasaliBrand } from "../data/pasaliCatalog";

const Footer = ({ contactInfo }) => {
  const resolvedContactInfo = mergeSiteContent(contactInfo);
  const paymentDetails = resolvedContactInfo.paymentDetails;
  const phoneLink = buildPhoneHref(resolvedContactInfo.phone || "");
  const emailLink = buildMailHref(resolvedContactInfo.email || "");
  const instagramLink = buildInstagramHref(resolvedContactInfo.socialLinks?.instagram || "");
  const facebookLink = buildFacebookHref(resolvedContactInfo.socialLinks?.facebook || "");
  const xLink = buildXHref(resolvedContactInfo.socialLinks?.x || resolvedContactInfo.socialLinks?.twitter || "");
  const whatsappLink = buildWhatsappHref(resolvedContactInfo.socialLinks?.whatsapp || "");
  const scrollToTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  };
  const pageLinks = [
    { label: "Ana Sayfa", to: "/" },
    { label: "Ürünler", to: "/products" },
    { label: "Hakkımızda", to: "/about" },
    { label: "İletişim", to: "/#iletisim" }
  ];
  const socialLinks = [
    { label: "Instagram", value: resolvedContactInfo.socialLinks?.instagram, href: instagramLink },
    { label: "Facebook", value: resolvedContactInfo.socialLinks?.facebook, href: facebookLink },
    { label: "X", value: resolvedContactInfo.socialLinks?.x || resolvedContactInfo.socialLinks?.twitter, href: xLink }
  ].filter((item) => item.value && item.href);
  const footerGridClassName = socialLinks.length
    ? "site-footer__inner site-footer__inner--five"
    : "site-footer__inner site-footer__inner--four";
  const footerMeta = resolvedContactInfo.workingHours || "";

  return (
    <footer className="site-footer" id="iletisim">
      <div className={footerGridClassName}>
        <section className="footer-column footer-column--brand">
          <Link to="/" className="footer-brand" aria-label={pasaliBrand.name} onClick={scrollToTop}>
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
              <Link
                key={item.label}
                to={item.to}
                className="footer-link"
                onClick={item.to.includes("#") ? undefined : scrollToTop}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </section>

        <section className="footer-column">
          <h4 className="footer-heading">ÖDEME BİLGİLERİ</h4>
          <div className="footer-list">
            <div className="footer-item">
              <span className="footer-item__label">IBAN Ad Soyad</span>
              <span className="footer-text">{paymentDetails.accountHolder}</span>
            </div>
            <div className="footer-item">
              <span className="footer-item__label">Banka Adı</span>
              <span className="footer-text">{paymentDetails.bankName}</span>
            </div>
            <div className="footer-item">
              <span className="footer-item__label">IBAN</span>
              <span className="footer-text">{paymentDetails.iban}</span>
            </div>
          </div>
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
          <span>© 2025 Paşalı Patiserrie. Tüm hakları saklıdır.</span>
          {footerMeta ? <span>{footerMeta}</span> : <span>Kurumsal ürün kataloğu ve sipariş deneyimi</span>}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
