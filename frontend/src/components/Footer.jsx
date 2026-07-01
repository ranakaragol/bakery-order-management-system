const Footer = ({ contactInfo }) => (
  <footer className="site-footer">
    <div>
      <h3>Firin Atelier</h3>
      <p>Modern kutlamalar icin tasarlanmis butik pastacilik deneyimi.</p>
    </div>

    <div>
      <h4>Iletisim</h4>
      <p>{contactInfo?.phone || "Telefon bilgisi hazirlaniyor"}</p>
      <p>{contactInfo?.email || "E-posta bilgisi hazirlaniyor"}</p>
      <p>{contactInfo?.address || "Adres bilgisi hazirlaniyor"}</p>
    </div>

    <div>
      <h4>Sosyal</h4>
      <p>{contactInfo?.socialLinks?.instagram || "Instagram linki eklenecek"}</p>
      <p>{contactInfo?.socialLinks?.facebook || "Facebook linki eklenecek"}</p>
      <p>{contactInfo?.socialLinks?.whatsapp || "WhatsApp linki eklenecek"}</p>
    </div>
  </footer>
);

export default Footer;
