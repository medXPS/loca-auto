export default function Legal() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Mentions légales</h1>
      <div className="prose prose-slate max-w-none space-y-6 text-slate-600">
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">1. Éditeur du site</h2>
          <p>Location Auto Maroc est une société spécialisée dans la location de véhicules au Maroc. Siège social : Casablanca, Maroc. Email : contact@locationauto.ma</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">2. Conditions générales de location</h2>
          <p>Tout locataire doit être titulaire d'un permis de conduire valide depuis au moins 2 ans et être âgé d'au moins 21 ans. Une pièce d'identité valide est obligatoire. Le locataire est responsable de tout dommage causé au véhicule pendant la période de location.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">3. Responsabilité</h2>
          <p>Location Auto Maroc ne saurait être tenu responsable des dommages indirects liés à l'utilisation du site ou du service de location. Le locataire assume l'entière responsabilité de l'usage du véhicule dans le respect du code de la route marocain.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">4. Propriété intellectuelle</h2>
          <p>L'ensemble des contenus présents sur ce site (textes, images, logos) sont protégés par le droit d'auteur. Toute reproduction est interdite sans autorisation préalable.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">5. Juridiction compétente</h2>
          <p>Tout litige relatif à l'utilisation du site ou au contrat de location sera soumis aux tribunaux compétents de Casablanca, Maroc.</p>
        </section>
      </div>
    </div>
  );
}
