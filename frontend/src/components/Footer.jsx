import { fallbackContactInfo } from "../utils/fallbackContent";

const Footer = ({ contactInfo }) => {
  const resolvedContactInfo = contactInfo || fallbackContactInfo;

  return (
    <footer className="site-footer">
      <div>
        <h3>Firin Atelier</h3>
        <p>Modern kutlamalar icin tasarlanmis butik pastacilik deneyimi.</p>
      </div>

      <div>
        <h4>Iletisim</h4>
        <p>{resolvedContactInfo.phone}</p>
        <p>{resolvedContactInfo.email}</p>
        <p>{resolvedContactInfo.address}</p>
      </div>

      <div>
        <h4>Sosyal</h4>
        <p>{resolvedContactInfo.socialLinks?.instagram}</p>
        <p>{resolvedContactInfo.socialLinks?.facebook}</p>
        <p>{resolvedContactInfo.socialLinks?.whatsapp}</p>
      </div>
    </footer>
  );
};

export default Footer;
