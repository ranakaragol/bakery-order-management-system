import { Link } from "react-router-dom";

const NotFoundPage = () => (
  <section className="panel">
    <h1>Sayfa bulunamadi</h1>
    <p>Aradiginiz sayfa tasinmis veya kaldirilmis olabilir.</p>
    <Link to="/" className="primary-button">
      Ana sayfaya don
    </Link>
  </section>
);

export default NotFoundPage;
