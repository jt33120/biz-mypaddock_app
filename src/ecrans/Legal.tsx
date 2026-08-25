import { CONTACT, EDITEUR, PRODUCT_NAME, REGION } from '../product'

/**
 * LES TEXTES QUI DOIVENT EXISTER AVANT LE PREMIER INCONNU — QO-11, §7.
 *
 * Écrits d'après CE QUE LE CODE FAIT, ligne par ligne, et non d'après ce qu'on
 * voudrait qu'il fasse. Le brouillon hérité de la version précédente disait
 * « aucune donnée personnelle n'est collectée » : c'était faux dès la première
 * inscription, et une politique fausse est pire que pas de politique.
 *
 * Deux principes tiennent tout le texte :
 *   · CHAQUE PHRASE EST VÉRIFIABLE DANS LE DÉPÔT. Les sous-traitants sont ceux
 *     qui reçoivent réellement quelque chose, la région est celle du projet
 *     (`eu-west-3`), et le portrait n'appelle Google que si le pilote le demande.
 *   · LES DROITS SONT DES BOUTONS, PAS DES PROCÉDURES. L'export et l'effacement
 *     sont dans l'écran compte, immédiats, sans formulaire et sans attente. On
 *     les nomme comme tels au lieu de renvoyer vers une adresse.
 */

export function Legal({ onFermer }: { onFermer: () => void }) {
  return (
    <section className="legal">
      <p className="libelle">à propos de {PRODUCT_NAME}</p>

      {/* ─── CE QUE LE PRODUIT EST, ET CE QU'IL N'EST PAS ─────────────── */}
      <h1 className="titre">Ce que fait cette application</h1>
      <p className="texte">
        {PRODUCT_NAME} est un carnet de roulage moto. Il enregistre tes journées de piste,
        tes chronos, ce qu'elles coûtent et ce que tu fais sur ta moto. Il fonctionne
        entièrement hors ligne ; le compte ne sert qu'à ce que ta saison survive au téléphone.
      </p>
      <div className="bloc pile">
        <div className="libelle">ce qu'il n'est pas</div>
        <p className="texte">
          Le carnet d'entretien est <b>auto-déclaré</b> : il atteste ce que tu as consigné,
          jamais un historique certifié par un tiers. Rien ici ne certifie la sécurité d'une
          moto, ne garantit une admission sur un circuit, ni ne dit ce qu'il faut faire.
        </p>
      </div>

      {/* ─── CONFIDENTIALITÉ ──────────────────────────────────────────── */}
      <h2 className="titre">Tes données</h2>
      <p className="texte">
        Sans compte, <b>rien ne quitte ton téléphone</b>. Tout le carnet fonctionne ainsi, et
        c'est le mode normal, pas un mode dégradé.
      </p>

      <div className="bloc pile">
        <div className="libelle">ce qui part au serveur, avec un compte</div>
        <p className="texte">
          Ton adresse e-mail et ton mot de passe (chiffré, jamais lisible par nous) ·
          tes roulages, sessions et chronos · tes dépenses et ton budget · tes motos et
          leurs interventions · tes photos · la phrase que tu écris pour toi-même ·
          et les trois mesures ci-dessous, si tu les acceptes.
        </p>
        <p className="note">
          Base légale : l'exécution du service que tu demandes en créant un compte. Les mesures
          reposent sur ton consentement, et se refusent d'un tap dans l'écran compte.
        </p>
      </div>

      <div className="bloc pile">
        <div className="libelle">les trois mesures, et rien d'autre</div>
        <p className="texte">
          Le délai entre un roulage et sa saisie · le nombre de récapitulatifs produits puis
          réellement partagés · le nombre d'ouvertures qui ne saisissent rien.
        </p>
        <p className="note">
          Aucune ne porte sur ton pilotage. Elles voyagent par le même chemin que tes données,
          sans traceur ni service tiers, et un refus empêche l'écriture — il ne la masque pas.
        </p>
      </div>

      <div className="bloc pile">
        <div className="libelle">qui héberge, et où</div>
        <p className="texte">
          <b>Supabase</b> (base de données, compte, stockage des photos) et
          <b> PowerSync</b> (synchronisation), tous deux à {REGION}.
          <b> Vercel</b> sert l'application. Tes données restent dans l'Union européenne.
        </p>
        <p className="note">
          Une seule exception, et elle ne se produit que si tu la demandes : quand tu demandes
          le portrait pixel de ta moto, cette photo-là — et elle seule — est envoyée à Google
          pour être redessinée. Aucune autre donnée ne l'accompagne, et rien ne part si tu ne
          demandes rien.
        </p>
      </div>

      <div className="bloc pile">
        <div className="libelle">pas de traceur, pas de publicité</div>
        <p className="texte">
          Aucun cookie de mesure d'audience, aucun pixel publicitaire, aucun revendeur de
          données. Le stockage du navigateur ne contient que ta session et tes réglages.
        </p>
      </div>

      <div className="bloc pile">
        <div className="libelle">tes droits, et ils sont dans l'écran compte</div>
        <p className="texte">
          <b>Emporter</b> te rend un fichier complet, lisible sans cette application, composé
          dans ton téléphone et sans réseau. <b>Effacer mon compte</b> supprime le compte, la
          saison et les photos du serveur, puis tout ce qui reste sur l'appareil — sans
          corbeille et sans délai.
        </p>
        <p className="note">
          Ce sont deux boutons, immédiats, sans formulaire ni attente. Pour toute autre demande —
          rectification, opposition, réclamation — l'adresse ci-dessous.
        </p>
      </div>

      {/* ─── CONDITIONS ───────────────────────────────────────────────── */}
      <h2 className="titre">Conditions</h2>
      <div className="bloc pile">
        <p className="texte">
          Le service est fourni tel quel, gratuitement, sans garantie de disponibilité. Tu
          restes responsable de ta moto, de ton équipement et de ta conduite ; rien de ce que
          l'application affiche ne remplace un contrôle, un professionnel ou les règles d'un
          organisateur. Tu es responsable de ce que tu saisis et de ce que tu partages.
        </p>
        <p className="texte">
          Tu peux cesser d'utiliser le service à tout moment en effaçant ton compte. Ces
          conditions peuvent évoluer ; la version en vigueur est celle affichée ici.
        </p>
      </div>

      {/* ─── MENTIONS ET CONTACT ──────────────────────────────────────── */}
      <h2 className="titre">Qui écrire</h2>
      <div className="bloc pile">
        {EDITEUR
          ? <p className="texte">Éditeur : {EDITEUR}</p>
          : <p className="note">L'éditeur n'est pas encore publié.</p>}
        {CONTACT ? (
          <>
            <p className="texte">
              Une question, un problème, une donnée à corriger : <a className="lien" href={`mailto:${CONTACT}`}>{CONTACT}</a>.
            </p>
            <p className="note">
              C'est la même adresse pour tout — support, vie privée, réclamation. Il n'y en a
              pas d'autre, et elle est lue.
            </p>
          </>
        ) : (
          /* Inventer une adresse qui ne répond pas serait pire que n'en afficher
             aucune : le §7 demande « au minimum une adresse QUI RÉPOND ». */
          <p className="note">
            Aucune adresse de contact n'est encore publiée. Tant qu'elle manque, cette
            application ne devrait être partagée avec personne.
          </p>
        )}
        <p className="note">Hébergement : Vercel Inc. et Supabase — {REGION} pour les données.</p>
      </div>

      <button className="bouton secondaire" onClick={onFermer}>Retour</button>
    </section>
  )
}
