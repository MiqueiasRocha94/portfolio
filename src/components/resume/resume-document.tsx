import { Document, Image as PdfImage, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { Children } from "react";

import type { Resume, ResumeLine } from "@/lib/resume/resume.schema";

/**
 * Documento PDF do currículo (docs/specs/curriculo.md → "Telas e estados"):
 * barra lateral azul com foto, contato, links, foco, stack, competências e
 * idiomas; coluna principal com resumo, experiência em linha do tempo, formação,
 * projetos e diferenciais. Recebe o currículo já projetado na versão. A barra
 * lateral fica só na primeira página (a cor de fundo se repete nas seguintes); a
 * coluna principal quebra sozinha. Carregado só ao gerar (resume-pdf.tsx).
 */

const COLOR = {
  sidebar: "#10213a",
  sidebarText: "#dbe6f2",
  sidebarMuted: "#9fb3c8",
  accent: "#3d9fd0",
  chip: "#eef3f8",
  sidebarChip: "#1c3352",
  text: "#142233",
  muted: "#5a6a7c",
  line: "#dbe3ec",
};

const SIDEBAR = 186;
const PAD = 26;

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: COLOR.text,
    paddingTop: PAD,
    paddingBottom: PAD,
    paddingLeft: SIDEBAR + PAD,
    paddingRight: PAD,
    lineHeight: 1.4,
  },
  sidebarBg: { position: "absolute", top: 0, left: 0, bottom: 0, width: SIDEBAR, backgroundColor: COLOR.sidebar },
  sidebar: { position: "absolute", top: 0, left: 0, width: SIDEBAR, paddingVertical: PAD, paddingHorizontal: 18, color: COLOR.sidebarText },
  photoRing: { alignSelf: "center", width: 104, height: 104, borderRadius: 52, borderWidth: 3, borderColor: COLOR.accent, padding: 3, marginBottom: 14 },
  photo: { width: 92, height: 92, borderRadius: 46, objectFit: "cover" },
  sideTitle: { fontFamily: "Helvetica-Bold", fontSize: 8, color: COLOR.accent, letterSpacing: 1.2, textTransform: "uppercase", marginTop: 12, marginBottom: 5 },
  sideText: { fontSize: 8.5, color: COLOR.sidebarText, marginBottom: 2 },
  sideMuted: { fontSize: 8, color: COLOR.sidebarMuted },
  sideLink: { fontSize: 8.5, color: COLOR.sidebarText, textDecoration: "none", marginBottom: 2 },
  sideGroup: { fontFamily: "Helvetica-Bold", fontSize: 7.5, color: COLOR.sidebarMuted, marginTop: 4, marginBottom: 2 },
  chips: { flexDirection: "row", flexWrap: "wrap" },
  sideChip: { fontSize: 7, color: COLOR.sidebarText, backgroundColor: COLOR.sidebarChip, borderRadius: 3, paddingVertical: 1.5, paddingHorizontal: 4, marginRight: 3, marginBottom: 3 },
  chip: { fontSize: 7.5, color: COLOR.text, backgroundColor: COLOR.chip, borderRadius: 3, paddingVertical: 1.5, paddingHorizontal: 5, marginRight: 3, marginBottom: 3 },
  bullet: { flexDirection: "row", marginBottom: 2 },
  bulletDot: { width: 8, color: COLOR.accent },
  name: { fontFamily: "Helvetica-Bold", fontSize: 24, color: COLOR.text, lineHeight: 1.1 },
  roles: { fontSize: 10.5, color: COLOR.accent, marginTop: 3, marginBottom: 2 },
  location: { fontSize: 8.5, color: COLOR.muted },
  rule: { height: 2, width: 40, backgroundColor: COLOR.accent, marginTop: 8, marginBottom: 4 },
  section: { marginTop: 12 },
  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: COLOR.text,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    borderBottomWidth: 1,
    borderBottomColor: COLOR.line,
    paddingBottom: 3,
    marginBottom: 6,
  },
  lead: { fontSize: 9.5, marginBottom: 4 },
  paragraph: { marginBottom: 4 },
  muted: { color: COLOR.muted },
  job: { flexDirection: "row" },
  rail: { width: 12, alignItems: "center" },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: COLOR.accent, marginTop: 3 },
  dotPast: { width: 7, height: 7, borderRadius: 3.5, borderWidth: 1.5, borderColor: COLOR.accent, marginTop: 3 },
  railLine: { flexGrow: 1, width: 1, backgroundColor: COLOR.line, marginTop: 2 },
  jobBody: { flex: 1, paddingLeft: 6, paddingBottom: 8 },
  jobHead: { flexDirection: "row", justifyContent: "space-between" },
  jobRole: { fontFamily: "Helvetica-Bold", fontSize: 10 },
  jobPeriod: { fontSize: 8, color: COLOR.muted },
  jobCompany: { fontSize: 9, color: COLOR.accent, marginBottom: 2 },
  bold: { fontFamily: "Helvetica-Bold" },
  itemTitle: { fontFamily: "Helvetica-Bold", fontSize: 9.5 },
  item: { marginBottom: 6 },
});

const texts = (lines: ResumeLine[]) => lines.map((line) => line.text).filter(Boolean);

function languageName(code: string): string {
  try {
    const name = new Intl.DisplayNames(["pt-BR"], { type: "language" }).of(code) ?? code;
    return name.charAt(0).toUpperCase() + name.slice(1);
  } catch {
    // Código fora do padrão BCP 47: mostra como foi escrito.
    return code;
  }
}

function Bullet({ line }: { line: ResumeLine }) {
  return (
    <View style={s.bullet} wrap={false}>
      <Text style={s.bulletDot}>•</Text>
      <Text style={{ flex: 1 }}>
        {line.label ? <Text style={s.bold}>{line.label} </Text> : null}
        {line.text}
      </Text>
    </View>
  );
}

function Sidebar({ resume, photoUrl }: { resume: Resume; photoUrl: string | null }) {
  const { profile } = resume;
  return (
    <View style={s.sidebar}>
      {photoUrl ? (
        <View style={s.photoRing}>
          <PdfImage src={photoUrl} style={s.photo} />
        </View>
      ) : null}
      {profile.contact && (profile.contact.email || profile.contact.phone) ? (
        <View>
          <Text style={s.sideTitle}>Contato</Text>
          {profile.contact.email ? <Text style={s.sideText}>{profile.contact.email}</Text> : null}
          {profile.contact.phone ? <Text style={s.sideText}>{profile.contact.phone}</Text> : null}
        </View>
      ) : null}
      {profile.links.length > 0 ? (
        <View>
          <Text style={s.sideTitle}>Links</Text>
          {profile.links.map((link) => (
            <Link key={link.key} src={link.url} style={s.sideLink}>
              {link.text}
            </Link>
          ))}
        </View>
      ) : null}
      {resume.focus.length > 0 ? (
        <View>
          <Text style={s.sideTitle}>Foco</Text>
          {texts(resume.focus).map((text) => (
            <Text key={text} style={s.sideText}>
              {text}
            </Text>
          ))}
        </View>
      ) : null}
      {resume.skills.length > 0 ? (
        <View>
          <Text style={s.sideTitle}>Competências</Text>
          {resume.skills.map((group) => (
            <View key={group.id} wrap={false}>
              <Text style={s.sideGroup}>{group.title}</Text>
              <View style={s.chips}>
                {texts(group.items).map((text) => (
                  <Text key={text} style={s.sideChip}>
                    {text}
                  </Text>
                ))}
              </View>
            </View>
          ))}
        </View>
      ) : null}
      {resume.languages.length > 0 ? (
        <View>
          <Text style={s.sideTitle}>Idiomas</Text>
          {resume.languages.map((language) => (
            <Text key={language.id} style={s.sideText}>
              {languageName(language.code)} <Text style={s.sideMuted}>· {language.level}</Text>
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

/** O título vai preso ao primeiro item, para não ficar sozinho no fim da página. */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [first, ...rest] = Children.toArray(children);
  return (
    <View style={s.section}>
      <View wrap={false}>
        <Text style={s.sectionTitle}>{title}</Text>
        {first}
      </View>
      {rest}
    </View>
  );
}

export function ResumeDocument({ resume, photoUrl }: { resume: Resume; photoUrl: string | null }) {
  const { profile } = resume;
  const [lead, ...summary] = texts(resume.summary);
  const lastSummary = summary.length > 1 ? summary.length - 1 : -1;

  return (
    <Document title={`Currículo — ${profile.name}`} author={profile.name} language="pt-BR">
      <Page size="A4" style={s.page}>
        <View fixed style={s.sidebarBg} />
        <Sidebar resume={resume} photoUrl={photoUrl} />

        <View>
          <Text style={s.name}>{profile.name}</Text>
          {profile.roles.length > 0 ? <Text style={s.roles}>{profile.roles.join(" · ")}</Text> : null}
          {profile.location ? <Text style={s.location}>{profile.location}</Text> : null}
          <View style={s.rule} />
          {resume.stack.length > 0 ? (
            <View style={[s.chips, { marginTop: 4 }]}>
              {texts(resume.stack).map((text) => (
                <Text key={text} style={s.chip}>
                  {text}
                </Text>
              ))}
            </View>
          ) : null}
        </View>

        {lead ? (
          <Section title="Resumo">
            <Text style={s.lead}>{lead}</Text>
            {summary.map((text, index) => (
              <Text key={text} style={index === lastSummary ? [s.paragraph, s.muted] : s.paragraph}>
                {text}
              </Text>
            ))}
          </Section>
        ) : null}

        {resume.experience.length > 0 ? (
          <Section title="Experiência">
            {resume.experience.map((job, index) => (
              <View key={job.id} style={s.job} wrap={job.highlights.length > 3}>
                <View style={s.rail}>
                  <View style={job.current ? s.dot : s.dotPast} />
                  {index < resume.experience.length - 1 ? <View style={s.railLine} /> : null}
                </View>
                <View style={s.jobBody}>
                  <View style={s.jobHead}>
                    <Text style={s.jobRole}>{job.role}</Text>
                    <Text style={s.jobPeriod}>{job.period}</Text>
                  </View>
                  <Text style={s.jobCompany}>
                    {[job.company, ...texts(job.meta)].filter(Boolean).join(" · ")}
                  </Text>
                  {job.description ? <Text style={s.paragraph}>{job.description}</Text> : null}
                  {job.highlights.map((line, lineIndex) => (
                    <Bullet key={lineIndex} line={line} />
                  ))}
                </View>
              </View>
            ))}
          </Section>
        ) : null}

        {resume.education.length > 0 ? (
          <Section title="Formação">
            {resume.education.map((course) => (
              <View key={course.id} style={s.item} wrap={false}>
                <Text style={s.itemTitle}>{course.course}</Text>
                <Text style={s.jobCompany}>{[course.institution, course.status].filter(Boolean).join(" · ")}</Text>
                {course.description ? <Text style={s.muted}>{course.description}</Text> : null}
              </View>
            ))}
          </Section>
        ) : null}

        {resume.projects.length > 0 ? (
          <Section title="Projetos">
            {resume.projects.map((project) => (
              <View key={project.id} style={s.item} wrap={false}>
                {project.url ? (
                  <Link src={project.url} style={[s.itemTitle, { color: COLOR.text, textDecoration: "none" }]}>
                    {project.name}
                  </Link>
                ) : (
                  <Text style={s.itemTitle}>{project.name}</Text>
                )}
                {project.description ? <Text style={s.paragraph}>{project.description}</Text> : null}
                {project.tags.length > 0 ? (
                  <View style={s.chips}>
                    {texts(project.tags).map((text) => (
                      <Text key={text} style={s.chip}>
                        {text}
                      </Text>
                    ))}
                  </View>
                ) : null}
              </View>
            ))}
          </Section>
        ) : null}

        {resume.highlights.length > 0 ? (
          <Section title="Diferenciais">
            {resume.highlights.map((line, index) => (
              <Bullet key={index} line={line} />
            ))}
          </Section>
        ) : null}
      </Page>
    </Document>
  );
}
