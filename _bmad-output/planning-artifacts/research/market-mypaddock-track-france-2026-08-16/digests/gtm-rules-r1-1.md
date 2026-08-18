# GTM, pricing, and regulatory/data constraints — France-first motorcycle track-day app

**Decision served:** choose an initial monetization/channel model without importing payment, insurance, marketplace, or third-party-data complexity into the MVP. Motorcycle first; car and vehicle-marketplace features later.

**Research firewall:** findings below use only web sources retrieved in this run. No project file or training-data conclusion is evidence. This digest does **not** make an overall viability verdict and is not legal advice.

## Scope and searches

- **Round 1 — broad mapping:** official 2026 organizer prices; French track-day discovery/booking competitors and disclosed take rates; mobile-app privacy; platform and distance-selling rules; HistoVec; payment and insurance intermediation; Leboncoin data-use terms; EU Data Act; Meta app-install automation.
- **Round 2 — clause and date verification:** opened the 15 sources cited below and checked the exact commission, price, consent, ranking, withdrawal, payment, insurance, scraping, and connected-device-data wording.
- Representative queries: `site:fr stage moto circuit tarifs roulage 2026 organisateur`; `site:activbike.net calendrier 2026 prix roulage`; `Welygo tarifs abonnement premium trackday`; `Tarmago réservation trackday commission prix`; `site:cnil.fr applications mobiles recommandations géolocalisation traceurs consentement`; `ACPR plateformes de paiement services de paiement encaissement pour compte de tiers`; `ACPR distributeur assurance immatriculation ORIAS plateforme internet`; `Service Public rétractation prestation loisir date déterminée`; `site:economie.gouv.fr dgccrf obligations places de marché en ligne`; `site:histovec.interieur.gouv.fr conditions utilisation données API`; `Leboncoin developer API official`; `site:leboncoin.fr conditions générales utilisation extraction données robot`; `site:digital-strategy.ec.europa.eu Data Act connected products`; `site:facebook.com/business Advantage+ app campaigns`.
- **Negative searches:** no public official Leboncoin developer portal, public HistoVec API, France/motorcycle-specific Meta CAC, published TrackMate organizer price, or independent verification of Tarmago's “up to 15% elsewhere” statement was found within the two-round budget. Absence from this search is not proof of nonexistence.

## Claims table

Confidence is claim-specific: **high** = current primary/legal source or direct contractual price page; **medium** = direct vendor statement without independent confirmation; **low** = marketing statement, ambiguous scope, or unverified inference.

| ID | Claim | Exact URL | Publisher | Pub date | Accessed | Confidence | Class |
|---|---|---|---|---|---|---|---|
| C1 | Activbike's 2026 direct calendar shows one-day examples of €129 non-member/€79 member at Bresse, €154–€164 regular Bresse dates, €201–€235 at Dijon-Prenois, €205–€233 at Magny-Cours GP, and €245 at Le Mans; formats and inclusions vary. | <https://activbike.net/calendrier> | Activbike | n.d. (2026 calendar) | 2026-08-16 | high | organizer-pricing |
| C2 | BMW Motorrad lists three 2026 branded track days at €280 TTC (Dijon-Prenois), €300 TTC (Le Castellet), and €330 TTC (Le Mans). | <https://www.bmw-motorrad.fr/fr/experience/overview/training/trackdays-roulage.html> | BMW Motorrad France | n.d. (2026 event page) | 2026-08-16 | high | organizer-pricing |
| C3 | WELYGO's April 2026 terms make simple listings and external-ticket redirects free to organizers; integrated WELYGO ticketing uses Stripe Connect Express and a 5% all-inclusive transaction commission, with the sale contract stated to be between rider and organizer. | <https://welygo.com/legal/cgu> | WELYGO | 2026-04 | 2026-08-16 | high | competitor-pricing |
| C4 | Tarmago states that its displayed price includes a 7% platform commission and presents a €89–€450 track-day ticket span; its claim that other platforms can charge up to 15% was not independently verified. | <https://tarmago.com/fr/guides/prix-trackday-moto> | Tarmago | n.d. (2026 guide) | 2026-08-16 | medium for 7%; low for “up to 15%” | competitor-pricing |
| C5 | A mobile OS permission is not generally valid GDPR/ePrivacy consent. The CNIL recommends the least intrusive permission, contextual requests, and an additional consent mechanism where terminal read/write operations require it. | <https://www.cnil.fr/fr/permissions-applications-mobiles-recommandations-de-la-cnil-pour-respecter-la-vie-privee> | CNIL | 2025-01-14 | 2026-08-16 | high | privacy-regulatory |
| C6 | HistoVec's official flow is owner-controlled: only the current registration-certificate holder can generate a report and choose to transmit its link; a prospective buyer asks the seller for it. | <https://histovec.interieur.gouv.fr/histovec/faq-comment-utiliser-histovec> | French Ministry of the Interior / HistoVec | n.d. | 2026-08-16 | high | government-data-access |
| C7 | Receiving buyer funds in one's own account and later remitting them to an organizer is third-party-funds collection. Habitual payment services are reserved to authorized PSPs; an agent of a PSP must be registered, and marketplace operators generally cannot rely casually on the commercial-agent exception. | <https://acpr.banque-france.fr/fr/professionnels/lacpr-vous-accompagne/parcours-fintech/contenus-pedagogiques/de-quel-statut-releve-mon-activite/jencaisse-des-fonds-et-les-reverse-une-tierce-personne> | ACPR / Banque de France | 2025-01-13 | 2026-08-16 | high | payments-regulatory |
| C8 | A pure insurance “indicator” may introduce parties and even receive an introduction commission if it does not discuss policy content or help conclude the contract; soliciting, collecting, advising on, or otherwise distributing insurance triggers the intermediary regime and normally ORIAS registration. | <https://acpr.banque-france.fr/fr/professionnels/lacpr-vous-accompagne/intermediaires/intermediaires-dassurance> | ACPR / Banque de France | 2025-06-12 | 2026-08-16 | high | insurance-regulatory |
| C9 | French online-platform rules cover both ranking/reference services and services that connect parties to contract. Operators must disclose ranking/reference criteria, whether referencing is paid, the intermediation model, and relevant offeror status in an easily accessible place. | <https://www.economie.gouv.fr/dgccrf/laction-de-la-dgccrf/les-enquetes-et-les-controles/les-obligations-dinformation-des-plateformes-numeriques> | DGCCRF | 2020-04-21 | 2026-08-16 | high | platform-regulatory |
| C10 | The DGCCRF's DSA summary says qualifying online marketplaces must identify sellers and design interfaces so sellers can provide precontractual, price, execution, payment, conformity, and safety information, and must check completeness. The exact application to a service-only track-day marketplace and any exemptions still needs scoped legal review. | <https://www.economie.gouv.fr/dgccrf/dsa-de-nouvelles-obligations-pour-les-professionnels> | DGCCRF | 2024-04-08 | 2026-08-16 | high for stated rule; medium for track-day scope | dsa-marketplace |
| C11 | Before a distance sale, the professional must identify the seller/service provider and disclose essential characteristics, total price including fees, performance date, payment/execution terms, complaint handling, mediation, and withdrawal status; a platform/comparator must clearly show who sells, ranking, and total price. | <https://www.service-public.gouv.fr/particuliers/vosdroits/F10483> | Service Public / DILA | 2025-09-09 | 2026-08-16 | high | consumer-law |
| C12 | The 14-day withdrawal right does not apply to leisure activities supplied on a fixed date or period. That exception does not erase the duty to disclose the absence of the right or the organizer's contractual cancellation/refund terms. | <https://www.service-public.gouv.fr/particuliers/vosdroits/F10485> | Service Public / DILA and DGCCRF | 2026-01-01 | 2026-08-16 | high | consumer-law |
| C13 | Leboncoin's current CGU prohibit extraction, reproduction, indexing, or robot-based retrieval of listings/content without prior express authorization; even links to the site are stated to require prior express agreement. | <https://www.leboncoin.fr/dc/cgu> | LBC France / leboncoin | n.d. (current CGU) | 2026-08-16 | high | third-party-data-terms |
| C14 | The EU Data Act has applied since 12 September 2025 and gives users access to and sharing control over raw data generated by connected devices such as cars. Its stated scope is connected-device-generated data, not a general entitlement to government records or marketplace listings. | <https://digital-strategy.ec.europa.eu/en/news/eu-data-act-gives-users-control-over-data-connected-devices> | European Commission, DG CONNECT | 2025-09-12 | 2026-08-16 | high for scope; medium for motorcycle implementation | connected-data-regulatory |
| C15 | Meta offers Advantage+ app campaigns that automate bidding, audience, placements, and delivery toward installs or in-app actions. The primary page provides no France-specific motorcycle CAC or guaranteed price, so it establishes technical availability, not channel economics. | <https://www.facebook.com/business/ads/meta-advantage-plus/app-campaigns> | Meta for Business | n.d. | 2026-08-16 | medium | paid-channel-primary-vendor |

## Pricing benchmarks and monetization implications

| Benchmark | Evidence | Decision implication |
|---|---|---|
| Mainstream one-day inventory observed directly | Activbike examples cluster from €129 to €245 for ordinary full-day entries, with a €105 evening format and a €305 performance-stage example [C1]. | Event price must retain format, sessions, membership, insurance, meal, and coaching fields; “cheapest” sorting without comparable inclusions will mislead. |
| Branded/premium one-day inventory | BMW Motorrad: €280–€330 TTC across Dijon, Castellet, and Le Mans [C2]. | Higher-value events enlarge absolute commission per booking, but are not comparable to bare track access. |
| Current direct competitor take-rate anchors | WELYGO 5% all-inclusive integrated ticketing [C3]; Tarmago self-discloses 7% included in displayed price [C4]. | **5–7% is the evidenced launch benchmark**, not proof that organizers will accept it from a new entrant. Tarmago's “up to 15% elsewhere” should not enter a forecast. |
| Gross revenue per booking at the observed €129–€330 band | Arithmetic from [C1]–[C4]: 5–7% yields roughly **€6.45–€23.10 gross** per booking before tax, support, refund/chargeback exposure, and any non-included payment costs. | A paid-acquisition model cannot be judged on install CPA alone. It needs confirmed-booking conversion and repeat-booking LTV; first-booking commission provides little room for broad paid acquisition. |
| Free supply acquisition precedent | WELYGO lets organizers use a free listing or free external-ticket redirect and charges only when its own checkout is used [C3]. | A low-friction **free discovery/referral tier** is an evidenced way to seed supply before charging for transactions or software. |

### Evidence-bounded monetization sequence

1. **MVP: free rider discovery + organizer-owned checkout.** Publish organizer-authorized event data, route bookings to the organizer, and do not touch buyer funds. This preserves the simplest payment/consumer-law posture while measuring demand.
2. **First monetization tests: organizer-funded, clearly labelled visibility or qualified-lead packages.** Paid ranking is possible only with conspicuous disclosure of the paid nature and ranking logic [C9]. Price this as a test, because no public organizer willingness-to-pay evidence was found.
3. **After repeat demand is demonstrated: 5–7% integrated booking via a licensed marketplace PSP.** The competitor anchor exists [C3][C4], but the product must map the actual fund flow and responsibilities before launch [C7].
4. **Consumer subscription is a later hypothesis, not a benchmarked starting point.** The retrieved direct competitors expose free discovery and monetize the transaction or organizer side; no current direct consumer-subscription price was found. Test paid utilities only after observing repeat use (for example, advanced alerts, document vault, group planning, or history), without paywalling basic event discovery prematurely.
5. **Insurance revenue is later and partner-led.** A pure, carefully bounded introduction may be possible; describing, comparing, recommending, or embedding purchase assistance can cross into regulated distribution [C8].

## Channel hypotheses

| Channel hypothesis | Evidence and logic | Minimum useful test / stop signal |
|---|---|---|
| **Organizer-first supply partnerships** | Free listing and external redirect are already used by WELYGO [C3]. Direct organizer data also avoids stale or unauthorized aggregation. | Obtain written feed/publication consent and measure event coverage, update latency, outbound clicks, and organizer-confirmed bookings. Stop automated ingestion for any organizer that cannot authorize or maintain data. |
| **High-intent organic pages: calendar, circuit, organizer, date, price** | Direct organizer and competitor sites expose precisely these searchable primitives [C1]–[C4]. This is evidence of content structure, not of traffic volume. | Index a limited set of fresh, authorized pages; measure impressions, click-through, and click-to-organizer rate. Do not infer demand from page count. |
| **Organizer/club co-marketing** | The commission pool per first booking is small [C1]–[C4], while organizers directly control inventory and buyer trust. | Test tracked links/QR codes/newsletter placements with named partners. Continue only when confirmed bookings or qualified leads can be attributed. |
| **Meta Advantage+ app/install pilot, not core forecast** | Meta can automate app acquisition [C15], but no France/motorcycle CAC was found, and Meta SDK/MMP measurement introduces privacy-consent work [C5]. | Run only after a conversion event beyond “install” exists (event view → organizer click → confirmed booking where available). Cap spend; compare CAC to contribution from multi-booking LTV. Stop if only cheap installs, not qualified actions, materialize. |
| **Featured/sponsored listings** | Platform rules require disclosure of paid referencing and ranking parameters [C9]. | Label sponsorship at the offer and explain ranking. Stop or redesign if users cannot distinguish relevance from paid placement. |

## MVP constraints

### A. Day-one product compliance and data design

- **Keep checkout outside the MVP.** Use organizer-owned booking links and avoid collecting or temporarily holding participant money. If the app later receives buyer funds for organizers, use a marketplace-capable licensed PSP flow and obtain specialist review; a generic merchant account is not a safe substitute [C7].
- **Treat even discovery/ranking as a regulated platform information surface.** Publish a short, permanently accessible “How listings and ranking work” page: data sources, default sort, paid placement, organizer relationship, and whether the app is only referring or intermediating [C9].
- **Show the real seller and price context.** Event cards and handoff pages should identify the organizer, state that the organizer supplies the event, show known total price/fees and inclusions, and date-stamp availability. Do not imply that the app guarantees a third party's stock or terms [C11].
- **Use privacy-minimal defaults.** Region/circuit/date filters and an optional manually entered postcode can deliver discovery without background geolocation. Ask for device location only contextually and at the least intrusive precision/duration. An OS prompt is not automatically legal consent for analytics, advertising, or sharing [C5].
- **Avoid ad-tech SDKs by default.** Basic first-party analytics with a tightly defined purpose is operationally simpler. If Meta SDK/MMP, cross-app identifiers, personalized ads, or non-essential terminal access is added, perform the consent/processor assessment before release [C5][C15].
- **Do not make identity documents or complete registration papers a default profile requirement.** Collect only fields that an organizer actually needs at handoff. Separate optional garage/profile data from booking essentials and define deletion/retention controls [C5].
- **HistoVec is a user-mediated link, not a lookup database.** For later used-bike/car workflows, let the registered holder paste or share the official report link. Do not request owner credentials, reverse-engineer the service, or promise automatic access [C6].
- **No Leboncoin scraping, mirroring, indexing, or systematic deep-linking without written permission.** The current CGU expressly restrict those actions, and the official-domain search found no public developer portal [C13]. Use direct owner/organizer submissions or negotiated feeds.
- **The Data Act is not an ingestion shortcut.** It may support a future user-authorized connected-motorcycle/vehicle-data feature, but it does not supply a right to HistoVec or Leboncoin data [C14].

### B. Obligations triggered only by later scope

| Later feature | New obligations/complexity to gate before build |
|---|---|
| **Integrated event checkout** | Precontractual seller, service, total-price, execution, complaint, mediation, withdrawal-status, and order-confirmation information [C11]. Fixed-date leisure normally lacks the 14-day withdrawal right, but the absence must be disclosed and organizer cancellation/refund rules remain contractual [C12]. Map which party contracts with the rider. |
| **Marketplace fund flow / organizer payouts** | Use an authorized PSP/marketplace product and document who holds funds, who is merchant of record, payout timing, refunds, chargebacks, and KYC. Receiving funds in the app company's own account for onward remittance is a regulated trigger [C7]. |
| **Embedded cancellation, weather, RC, or personal-accident insurance** | A bare introduction can stay outside distribution only while the app does not discuss content or help conclude; advice, comparison, solicitation, collection of subscription, or purchase assistance normally triggers intermediary/ORIAS duties [C8]. Establish the boundary in the partner contract and UX. |
| **User/organizer marketplace with listings and contracting** | Seller/offeror verification, ranking transparency, paid-placement disclosure, complete precontractual fields, and potentially DSA marketplace processes become central [C9]–[C11]. Confirm the precise DSA classification and any small-enterprise exemptions for a service-only marketplace before relying on them. |
| **Used-bike marketplace; car later** | Add seller identity/vehicle-description controls, owner-mediated HistoVec sharing [C6], and no third-party listing reuse without authorization [C13]. Do not bundle this into the track-day MVP. |
| **Connected-bike telemetry, maintenance, or OEM data** | Validate that each device/OEM is a connected product/service in scope, what raw data are actually available, how the user authorizes sharing, and how GDPR applies. The Data Act creates a framework, not a universal OEM API [C14]. |

## Contradictions, gaps, and leads

### Contradictions / comparability cautions

- **5% versus 7% is a genuine observed pricing difference, not a settled market rate.** WELYGO's figure is in current contractual terms and says “all inclusive”; Tarmago's is in a self-authored guide. Payment fees, VAT treatment, refunds, chargebacks, and organizer-specific agreements were not made comparable [C3][C4].
- **Event prices are not like-for-like.** BMW's branded days and Activbike's different session counts, membership prices, meals, coaching, evening formats, and circuit costs explain part of the €79–€330 spread [C1][C2]. A single “average track-day price” would be misleading.
- **Contract labels do not settle regulated status.** WELYGO says it is not party to the sale and uses Stripe Connect [C3]; ACPR classification depends on the actual fund and contractual flow [C7]. Any future clone of that model needs its own analysis.
- **DSA scope needs narrowing.** The DGCCRF summary strongly addresses online marketplaces and seller/product safety [C10], but this run did not verify every article and exemption for a small, service-only track-day platform.

### Open gaps

- No organizer interviews, invoices, or signed commercial schedules were obtained; willingness to pay 5–7%, a lead fee, a monthly SaaS fee, or sponsorship remains unverified.
- No independent traffic, conversion, repeat-booking, refund, or CAC data were found for WELYGO, Tarmago, TrackMate, or PlanTrackDay.
- No direct competitor consumer-subscription price and no published TrackMate organizer price were found.
- No France-specific motorcycle Meta CPM/CPI/CAC evidence was found. Meta's official page is capability/marketing evidence only [C15].
- No public official Leboncoin developer portal or public HistoVec API was found. Commercial or government partner access could exist outside public documentation.
- Actual connected-motorcycle data/API availability by BMW, Yamaha, Honda, Kawasaki, Ducati, and telematics vendors was outside this source budget.

### Best next leads

1. Interview a deliberately mixed organizer sample (association, regional organizer, premium school, multi-circuit operator) and request the current booking/payment stack, all-in cost, refund workload, fill-rate pain, and acceptable commercial model.
2. Obtain organizer-side terms or a written quote from WELYGO, Tarmago, and TrackMate; normalize commission, PSP fees, VAT, refunds, chargebacks, payouts, exclusivity, and data ownership.
3. Commission a narrow French counsel memo on four questions only: L.111-7 disclosure for referral/ranking; DSA classification/exemptions for a service marketplace; marketplace PSP architecture; fixed-date leisure withdrawal disclosure.
4. Ask an ACPR-regulated track insurance partner for a written “indicator versus distributor” UX boundary before adding insurance copy or comparison.
5. Seek explicit organizer/circuit data-feed licenses; treat owner-entered events plus verification as the fallback.
6. Run paid-channel tests only after confirmed-booking attribution exists; otherwise use organizer co-marketing and organic inventory pages to learn at lower regulatory and economic cost.

