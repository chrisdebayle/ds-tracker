import bcrypt from "bcryptjs";
import { db } from "./index";
import { dailyLogEntries, engagements, recordings, reps, segments, users } from "./schema";
import type { DispositionCounts } from "@/lib/disposition";

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "apps@chrisdebayle.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "changeme123";

  const [admin] = await db
    .insert(users)
    .values({
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 10),
      name: "Chris DeBayle",
      role: "admin",
    })
    .onConflictDoNothing({ target: users.email })
    .returning();

  console.log(admin ? `Created admin user ${adminEmail}` : `Admin user ${adminEmail} already exists`);

  const [jafar] = await db
    .insert(engagements)
    .values({
      name: "Jafar AI, Inc.",
      location: "Newark, DE",
      status: "completed",
      startDate: "2026-06-03",
      endDate: "2026-08-14",
      owner: "Chris DeBayle",
      dialers: "PhoneBurner",
      sowReference: "SOW-202505-001",
      notes:
        "Voice-agent outbound engagement across three target lists in dental and medical verticals. Concluded by mutual termination for convenience.",
      headlineQuote:
        "Every negative outcome traced back to who was on the list or how they were being reached, not what was being said.",
      findings: [
        "Account fit — 51.5% · NISL 86 + Not Interested 55",
        "Contact method — 21.5% · Nurture 51 + DNC 8",
        "Title targeting — 15.0% · Referred 36 + Not Me 5",
        "List hygiene — 5.1% · No Longer With Company 14",
      ],
      nextSteps: [
        "Back-fill dispositions on the 687 contacts already worked and never tagged — zero new dials required.",
        "Add call-volume and competitor-in-place as disqualifiers, not just industry.",
        "Add a practice-size or provider-count filter for Private Medical Practice.",
        "Audit the sourcing behind “Overloaded DSO” — verify multi-location status before an account is added.",
        "Source office lines before personal mobiles in Private Medical Practice.",
        "Skip generalist gatekeeper titles in Overloaded DSO — go top-down to the actual decision-maker.",
      ],
      createdById: admin?.id,
    })
    .returning();

  const [chris, jordan, maria] = await db
    .insert(reps)
    .values([
      { engagementId: jafar.id, name: "Chris DeBayle" },
      { engagementId: jafar.id, name: "Jordan Reyes" },
      { engagementId: jafar.id, name: "Maria Santos" },
    ])
    .returning();

  const zero: DispositionCounts = {
    meeting: 0,
    activated: 0,
    notNow: 0,
    notMe: 0,
    referred: 0,
    noLongerWith: 0,
    notInterested: 0,
    dnc: 0,
    nurture: 0,
    nisl: 0,
  };

  const [dso, outpatient, pmp] = await db
    .insert(segments)
    .values([
      {
        engagementId: jafar.id,
        name: "Overloaded DSO",
        listTotal: 300,
        logic:
          "Multi-location DSOs sourced for high call volume; 15+ chairs across locations, verified multi-site status required.",
        // Historical dials attributable to this segment before the tool was adopted, derived
        // from the client's all-time 3,120 dials minus what this run's daily log accounts for,
        // split proportionally by each segment's share of pre-tool completed conversations.
        baseDials: 1225,
        baseCounts: { ...zero, activated: 1, notNow: 6, referred: 24, notInterested: 13, nurture: 9, nisl: 66 },
        read: "Account fit and titles both fail at once — the highest NISL of any list despite being sourced for scale.",
      },
      {
        engagementId: jafar.id,
        name: "Outpatient Groups",
        listTotal: 218,
        logic: "Multi-provider outpatient groups; targets Office Manager or Practice Administrator titles.",
        baseDials: 927,
        baseCounts: { ...zero, activated: 2, notNow: 4, referred: 10, notInterested: 17, nurture: 38, nisl: 19 },
        read: "Nurture leads but is unconfirmed — most of those records carry a placeholder title, not a real name.",
      },
      {
        engagementId: jafar.id,
        name: "Private Medical Practice",
        listTotal: 646,
        logic: "Independent solo and small-group medical practices; sourced primarily from public directories.",
        baseDials: 680,
        read: "Best account fit of the three, worst data discipline — only 10.2% of the list has ever been disposed.",
        baseCounts: {
          ...zero,
          meeting: 1,
          activated: 4,
          referred: 2,
          noLongerWith: 14,
          notInterested: 28,
          dnc: 8,
          nurture: 4,
          nisl: 5,
        },
      },
    ])
    .returning();

  await db.insert(dailyLogEntries).values([
    {
      engagementId: jafar.id,
      segmentId: dso.id,
      repId: chris.id,
      date: "2026-08-11",
      dials: 58,
      talkTimeMinutes: 22,
      counts: { ...zero, notNow: 1, referred: 2, noLongerWith: 1, notInterested: 3, nurture: 3, nisl: 5 },
    },
    {
      engagementId: jafar.id,
      segmentId: outpatient.id,
      repId: jordan.id,
      date: "2026-08-11",
      dials: 64,
      talkTimeMinutes: 19,
      counts: { ...zero, activated: 1, notMe: 1, referred: 1, notInterested: 4, dnc: 1, nurture: 2, nisl: 6 },
    },
    {
      engagementId: jafar.id,
      segmentId: pmp.id,
      repId: maria.id,
      date: "2026-08-12",
      dials: 51,
      talkTimeMinutes: 25,
      counts: { ...zero, notNow: 1, referred: 3, notInterested: 2, nurture: 4, nisl: 4 },
    },
    {
      engagementId: jafar.id,
      segmentId: dso.id,
      repId: chris.id,
      date: "2026-08-13",
      dials: 60,
      talkTimeMinutes: 21,
      counts: { ...zero, meeting: 1, activated: 1, referred: 2, noLongerWith: 1, notInterested: 3, nurture: 3, nisl: 7 },
    },
    {
      engagementId: jafar.id,
      segmentId: outpatient.id,
      repId: jordan.id,
      date: "2026-08-13",
      dials: 55,
      talkTimeMinutes: 17,
      counts: { ...zero, notNow: 1, notMe: 1, referred: 1, notInterested: 5, nurture: 2, nisl: 5 },
    },
  ]);

  await db.insert(recordings).values([
    {
      engagementId: jafar.id,
      date: "2026-08-13",
      repId: chris.id,
      contact: "Jordan Reyes",
      company: "Overloaded DSO Group",
      durationMinutes: 12,
      consent: true,
      notes: "Referred to Ops Director; asked for ROI case study.",
      url: "https://drive.google.com/placeholder-1",
    },
    {
      engagementId: jafar.id,
      date: "2026-08-12",
      repId: maria.id,
      contact: "Tooth Fairy Mobile",
      company: "Tooth Fairy Mobile",
      durationMinutes: 15,
      consent: true,
      notes: "Booked discovery meeting — the one meeting logged this run.",
      url: "https://drive.google.com/placeholder-2",
    },
  ]);

  console.log(`Seeded engagement "Jafar AI, Inc." (${jafar.id})`);
  console.log(`Admin login: ${adminEmail} / ${admin ? adminPassword : "(existing password unchanged)"}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
