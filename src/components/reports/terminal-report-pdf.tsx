"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  PDFDownloadLink,
  Font,
} from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReportConfig {
  crest_position: "left" | "center" | "right";
  headteacher_name: string;
  next_term_date: string;
  show_position: boolean;
  show_grading_scale: boolean;
  subject_groupings: Array<{ name: string; subjects: string[] }>;
  conduct_fields: Array<{ label: string }>;
  signature_fields: Array<{ title: string; name: string }>;
  grading_scale: Array<{ grade: number; min: number; max: number; remark: string }>;
}

export interface SubjectGrade {
  subject: string;
  subject_id: string;
  class_score: number;
  exam_score: number;
  total: number;
  grade: number;
  remark: string;
}

export interface StudentReport {
  student: {
    id: string;
    name: string;
    admission: string;
    gender: string;
    dob?: string;
    photo_url?: string;
  };
  grades: SubjectGrade[];
  overall_total: number;
  average: number;
  position: number;
  total_in_class: number;
  subject_count: number;
}

export interface SchoolInfo {
  name: string;
  logo?: string | null;
  motto?: string | null;
  address?: string | null;
  district?: string | null;
  region?: string | null;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  page: {
    padding: 28,
    fontSize: 9,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },

  // Header
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottom: "2 solid #1a1a1a",
    paddingBottom: 8,
    marginBottom: 6,
  },
  crestLeft: { flexDirection: "row", alignItems: "center" },
  crestCenter: { flexDirection: "column", alignItems: "center" },
  crestRight: { flexDirection: "row-reverse", alignItems: "center" },
  logo: { width: 52, height: 52 },
  logoPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    border: "1 solid #d1d5db",
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  logoPlaceholderText: { fontSize: 7, color: "#9ca3af", textAlign: "center" },
  schoolInfo: { flex: 1, paddingLeft: 10 },
  schoolInfoCenter: { alignItems: "center", flex: 1 },
  schoolName: { fontSize: 14, fontFamily: "Helvetica-Bold", textTransform: "uppercase" },
  schoolMotto: { fontSize: 8, fontStyle: "italic", color: "#374151", marginTop: 1 },
  schoolMeta: { fontSize: 7.5, color: "#6b7280", marginTop: 1 },

  // Report title banner
  titleBanner: {
    backgroundColor: "#1e3a5f",
    padding: "5 8",
    marginBottom: 8,
    borderRadius: 2,
  },
  titleBannerText: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  // Student info grid
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    border: "1 solid #d1d5db",
    marginBottom: 8,
    borderRadius: 2,
  },
  infoCell: {
    width: "33.33%",
    flexDirection: "row",
    padding: "4 8",
    borderBottom: "0.5 solid #e5e7eb",
    borderRight: "0.5 solid #e5e7eb",
  },
  infoCellWide: {
    width: "66.66%",
    flexDirection: "row",
    padding: "4 8",
    borderBottom: "0.5 solid #e5e7eb",
  },
  infoLabel: { fontSize: 7.5, color: "#6b7280", width: 70 },
  infoValue: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: "#111827", flex: 1 },

  // Section heading
  sectionTitle: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    color: "#1e3a5f",
    backgroundColor: "#eff6ff",
    padding: "3 6",
    marginBottom: 0,
    border: "0.5 solid #bfdbfe",
  },

  // Subject table
  table: { border: "0.5 solid #d1d5db", marginBottom: 8, borderRadius: 2 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#1e3a5f",
    padding: "4 0",
  },
  tableRow: { flexDirection: "row", borderBottom: "0.5 solid #e5e7eb" },
  tableRowAlt: { flexDirection: "row", borderBottom: "0.5 solid #e5e7eb", backgroundColor: "#f8fafc" },

  colSubject: { flex: 3, padding: "3 6", fontSize: 8 },
  colScore: { width: 52, padding: "3 4", fontSize: 8, textAlign: "center" },
  colTotal: { width: 44, padding: "3 4", fontSize: 8, textAlign: "center" },
  colGrade: { width: 32, padding: "3 4", fontSize: 8, textAlign: "center" },
  colRemark: { width: 58, padding: "3 6", fontSize: 8 },

  tableHeaderText: { color: "#ffffff", fontFamily: "Helvetica-Bold", fontSize: 7.5, textAlign: "center" },
  tableHeaderSubject: { color: "#ffffff", fontFamily: "Helvetica-Bold", fontSize: 7.5 },

  // Position / aggregate row
  aggregateRow: {
    flexDirection: "row",
    backgroundColor: "#f0fdf4",
    borderTop: "1 solid #16a34a",
    padding: "4 6",
    justifyContent: "space-between",
    marginBottom: 8,
    border: "0.5 solid #bbf7d0",
    borderRadius: 2,
  },
  aggregateItem: { alignItems: "center" },
  aggregateLabel: { fontSize: 7, color: "#6b7280" },
  aggregateValue: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#15803d" },

  // Conduct section
  conductGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    border: "0.5 solid #d1d5db",
    marginBottom: 8,
    borderRadius: 2,
  },
  conductCell: {
    width: "50%",
    flexDirection: "row",
    padding: "4 8",
    borderBottom: "0.5 solid #e5e7eb",
    borderRight: "0.5 solid #e5e7eb",
    alignItems: "center",
  },
  conductLabel: { fontSize: 8, color: "#374151", flex: 1 },
  conductDots: { flex: 2, borderBottom: "0.5 dotted #9ca3af", marginLeft: 4, marginRight: 4, height: 8 },

  // Remarks
  remarksRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  remarkBox: {
    flex: 1,
    border: "0.5 solid #d1d5db",
    borderRadius: 2,
    padding: "5 7",
    minHeight: 48,
  },
  remarkLabel: { fontSize: 7.5, color: "#6b7280", fontFamily: "Helvetica-Bold", marginBottom: 3 },
  remarkLine: { borderBottom: "0.5 dotted #9ca3af", height: 12, marginBottom: 3 },

  // Grading scale
  scaleTable: { border: "0.5 solid #d1d5db", marginBottom: 8, borderRadius: 2 },
  scaleRow: { flexDirection: "row", borderBottom: "0.5 solid #e5e7eb" },
  scaleCell: { flex: 1, padding: "2 4", fontSize: 7.5, textAlign: "center", borderRight: "0.5 solid #e5e7eb" },
  scaleHeaderCell: {
    flex: 1,
    padding: "3 4",
    fontSize: 7.5,
    textAlign: "center",
    backgroundColor: "#374151",
    color: "#ffffff",
    fontFamily: "Helvetica-Bold",
    borderRight: "0.5 solid #6b7280",
  },

  // Signatures
  signaturesRow: {
    flexDirection: "row",
    marginBottom: 8,
    gap: 12,
  },
  signatureBox: {
    flex: 1,
    alignItems: "center",
    padding: "6 8",
    border: "0.5 solid #d1d5db",
    borderRadius: 2,
  },
  signatureName: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: "#111827", marginBottom: 1 },
  signatureTitle: { fontSize: 7.5, color: "#6b7280" },
  signatureLine: { borderBottom: "1 solid #374151", width: "100%", marginBottom: 3, marginTop: 10 },
  signatureDate: { fontSize: 7, color: "#9ca3af", marginTop: 2 },

  // Footer
  footer: {
    borderTop: "1 solid #e5e7eb",
    paddingTop: 5,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: { fontSize: 7, color: "#9ca3af" },
  nextTermBox: {
    backgroundColor: "#fefce8",
    border: "0.5 solid #fde047",
    padding: "3 8",
    borderRadius: 2,
  },
  nextTermText: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#854d0e" },
});

// ─── Ordinal helper ───────────────────────────────────────────────────────────

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SchoolHeader({ school, config }: { school: SchoolInfo; config: ReportConfig }) {
  const pos = config.crest_position;
  const containerStyle =
    pos === "center" ? S.crestCenter : pos === "right" ? S.crestRight : S.crestLeft;
  const infoStyle = pos === "center" ? S.schoolInfoCenter : S.schoolInfo;

  const LogoNode = school.logo ? (
    <Image src={school.logo} style={S.logo} />
  ) : (
    <View style={S.logoPlaceholder}>
      <Text style={S.logoPlaceholderText}>CREST</Text>
    </View>
  );

  return (
    <View style={S.headerRow}>
      {pos !== "center" && LogoNode}
      <View style={infoStyle}>
        {pos === "center" && LogoNode}
        <Text style={S.schoolName}>{school.name}</Text>
        {school.motto && <Text style={S.schoolMotto}>"{school.motto}"</Text>}
        {(school.address || school.district || school.region) && (
          <Text style={S.schoolMeta}>
            {[school.address, school.district, school.region].filter(Boolean).join(" | ")}
          </Text>
        )}
      </View>
    </View>
  );
}

function StudentInfoGrid({
  report,
  term,
  academicYear,
  className,
  noOnRoll,
  config,
}: {
  report: StudentReport;
  term: string;
  academicYear: string;
  className: string;
  noOnRoll: number;
  config: ReportConfig;
}) {
  const cells = [
    { label: "Student Name", value: report.student.name, wide: true },
    { label: "Admission No.", value: report.student.admission },
    { label: "Class", value: className },
    { label: "Academic Year", value: academicYear },
    { label: "Term", value: term },
    { label: "Gender", value: report.student.gender },
    { label: "No. on Roll", value: String(noOnRoll) },
    ...(config.show_position
      ? [{ label: "Position", value: `${ordinal(report.position)} / ${report.total_in_class}` }]
      : []),
  ];

  return (
    <View style={S.infoGrid}>
      {cells.map((c, i) => (
        <View key={i} style={c.wide ? S.infoCellWide : S.infoCell}>
          <Text style={S.infoLabel}>{c.label}:</Text>
          <Text style={S.infoValue}>{c.value}</Text>
        </View>
      ))}
    </View>
  );
}

function SubjectTable({
  groupName,
  grades,
}: {
  groupName?: string;
  grades: SubjectGrade[];
}) {
  if (grades.length === 0) return null;
  return (
    <View style={S.table}>
      {groupName && <Text style={S.sectionTitle}>{groupName}</Text>}
      <View style={S.tableHeader}>
        <View style={[S.colSubject, { paddingLeft: 6 }]}>
          <Text style={S.tableHeaderSubject}>SUBJECT</Text>
        </View>
        <View style={S.colScore}>
          <Text style={S.tableHeaderText}>CLASS{"\n"}SCORE (30%)</Text>
        </View>
        <View style={S.colScore}>
          <Text style={S.tableHeaderText}>EXAM{"\n"}SCORE (70%)</Text>
        </View>
        <View style={S.colTotal}>
          <Text style={S.tableHeaderText}>TOTAL{"\n"}(100%)</Text>
        </View>
        <View style={S.colGrade}>
          <Text style={S.tableHeaderText}>GRADE</Text>
        </View>
        <View style={S.colRemark}>
          <Text style={S.tableHeaderSubject}>REMARK</Text>
        </View>
      </View>
      {grades.map((g, i) => (
        <View key={g.subject_id ?? i} style={i % 2 === 0 ? S.tableRow : S.tableRowAlt}>
          <View style={S.colSubject}>
            <Text>{g.subject}</Text>
          </View>
          <View style={S.colScore}>
            <Text style={{ textAlign: "center" }}>{g.class_score.toFixed(1)}</Text>
          </View>
          <View style={S.colScore}>
            <Text style={{ textAlign: "center" }}>{g.exam_score.toFixed(1)}</Text>
          </View>
          <View style={S.colTotal}>
            <Text style={{ textAlign: "center", fontFamily: "Helvetica-Bold" }}>
              {g.total.toFixed(1)}
            </Text>
          </View>
          <View style={S.colGrade}>
            <Text style={{ textAlign: "center", fontFamily: "Helvetica-Bold" }}>{g.grade}</Text>
          </View>
          <View style={S.colRemark}>
            <Text>{g.remark}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function AggregateRow({ report, config }: { report: StudentReport; config: ReportConfig }) {
  const items = [
    { label: "Total Score", value: report.overall_total.toFixed(1) },
    { label: "Average", value: `${report.average.toFixed(1)}%` },
    { label: "No. of Subjects", value: String(report.subject_count) },
    ...(config.show_position
      ? [{ label: "Position in Class", value: `${ordinal(report.position)} out of ${report.total_in_class}` }]
      : []),
  ];
  return (
    <View style={S.aggregateRow}>
      {items.map((item, i) => (
        <View key={i} style={S.aggregateItem}>
          <Text style={S.aggregateLabel}>{item.label}</Text>
          <Text style={S.aggregateValue}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}

function ConductSection({ config }: { config: ReportConfig }) {
  if (!config.conduct_fields || config.conduct_fields.length === 0) return null;
  return (
    <View style={{ marginBottom: 8 }}>
      <Text style={S.sectionTitle}>CONDUCT / ATTITUDE</Text>
      <View style={S.conductGrid}>
        {config.conduct_fields.map((field, i) => (
          <View key={i} style={S.conductCell}>
            <Text style={S.conductLabel}>{field.label}:</Text>
            <View style={S.conductDots} />
          </View>
        ))}
      </View>
    </View>
  );
}

function RemarksSection() {
  return (
    <View style={S.remarksRow}>
      <View style={S.remarkBox}>
        <Text style={S.remarkLabel}>CLASS TEACHER'S REMARKS</Text>
        <View style={S.remarkLine} />
        <View style={S.remarkLine} />
        <View style={S.remarkLine} />
      </View>
      <View style={S.remarkBox}>
        <Text style={S.remarkLabel}>HEADTEACHER'S REMARKS</Text>
        <View style={S.remarkLine} />
        <View style={S.remarkLine} />
        <View style={S.remarkLine} />
      </View>
    </View>
  );
}

function GradingScale({ config }: { config: ReportConfig }) {
  if (!config.show_grading_scale) return null;
  return (
    <View style={{ marginBottom: 8 }}>
      <Text style={S.sectionTitle}>GRADING SCALE</Text>
      <View style={S.scaleTable}>
        <View style={S.scaleRow}>
          {config.grading_scale.map((g) => (
            <Text key={g.grade} style={S.scaleHeaderCell}>
              Grade {g.grade}
            </Text>
          ))}
        </View>
        <View style={S.scaleRow}>
          {config.grading_scale.map((g) => (
            <Text key={g.grade} style={S.scaleCell}>
              {g.min} – {g.max}
            </Text>
          ))}
        </View>
        <View style={S.scaleRow}>
          {config.grading_scale.map((g) => (
            <Text key={g.grade} style={[S.scaleCell, { color: "#374151" }]}>
              {g.remark}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

function SignaturesSection({ config }: { config: ReportConfig }) {
  return (
    <View style={S.signaturesRow}>
      {config.signature_fields.map((sig, i) => (
        <View key={i} style={S.signatureBox}>
          <View style={S.signatureLine} />
          {sig.name ? <Text style={S.signatureName}>{sig.name}</Text> : null}
          <Text style={S.signatureTitle}>{sig.title}</Text>
          <Text style={S.signatureDate}>Date: ___________________</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Full Document ────────────────────────────────────────────────────────────

function buildSubjectGroups(
  grades: SubjectGrade[],
  groupings: ReportConfig["subject_groupings"]
): Array<{ name: string; grades: SubjectGrade[] }> {
  const assigned = new Set<string>();
  const result: Array<{ name: string; grades: SubjectGrade[] }> = [];

  for (const group of groupings) {
    if (!group.subjects || group.subjects.length === 0) continue;
    const matched = grades.filter((g) => group.subjects.includes(g.subject));
    if (matched.length > 0) {
      matched.forEach((g) => assigned.add(g.subject));
      result.push({ name: group.name, grades: matched });
    }
  }

  // Unassigned subjects fall into an "Other Subjects" group
  const unassigned = grades.filter((g) => !assigned.has(g.subject));
  if (unassigned.length > 0) {
    result.push({
      name: result.length === 0 ? "Subjects" : "Other Subjects",
      grades: unassigned,
    });
  }

  return result;
}

function TerminalReportDocument({
  report,
  school,
  config,
  term,
  academicYear,
  className,
  noOnRoll,
}: {
  report: StudentReport;
  school: SchoolInfo;
  config: ReportConfig;
  term: string;
  academicYear: string;
  className: string;
  noOnRoll: number;
}) {
  const groups = buildSubjectGroups(report.grades, config.subject_groupings);

  return (
    <Document>
      <Page size="A4" style={S.page}>
        {/* School Header */}
        <SchoolHeader school={school} config={config} />

        {/* Report Title */}
        <View style={S.titleBanner}>
          <Text style={S.titleBannerText}>
            Terminal Report — {term}, {academicYear}
          </Text>
        </View>

        {/* Student Info */}
        <StudentInfoGrid
          report={report}
          term={term}
          academicYear={academicYear}
          className={className}
          noOnRoll={noOnRoll}
          config={config}
        />

        {/* Subject Tables by group */}
        {groups.map((g, i) => (
          <SubjectTable key={i} groupName={g.name} grades={g.grades} />
        ))}

        {/* Aggregate row */}
        <AggregateRow report={report} config={config} />

        {/* Conduct */}
        <ConductSection config={config} />

        {/* Teacher + Headteacher Remarks */}
        <RemarksSection />

        {/* Grading Scale */}
        <GradingScale config={config} />

        {/* Signatures */}
        <SignaturesSection config={config} />

        {/* Footer */}
        <View style={S.footer}>
          <Text style={S.footerText}>
            Generated by SchoolMS · {new Date().toLocaleDateString()}
          </Text>
          {config.next_term_date && (
            <View style={S.nextTermBox}>
              <Text style={S.nextTermText}>
                Next Term Reopens: {config.next_term_date}
              </Text>
            </View>
          )}
        </View>
      </Page>
    </Document>
  );
}

// ─── Download Button ──────────────────────────────────────────────────────────

export function TerminalReportDownloadButton({
  report,
  school,
  config,
  term,
  academicYear,
  className,
  noOnRoll,
}: {
  report: StudentReport;
  school: SchoolInfo;
  config: ReportConfig;
  term: string;
  academicYear: string;
  className: string;
  noOnRoll: number;
}) {
  const safeConfig: ReportConfig = {
    crest_position: config.crest_position ?? "left",
    headteacher_name: config.headteacher_name ?? "",
    next_term_date: config.next_term_date ?? "",
    show_position: config.show_position ?? true,
    show_grading_scale: config.show_grading_scale ?? true,
    subject_groupings: config.subject_groupings ?? [],
    conduct_fields: config.conduct_fields ?? [],
    signature_fields: config.signature_fields ?? [],
    grading_scale: config.grading_scale ?? [],
  };

  const fileName = `report_${report.student.admission}_${term.replace(/\s+/g, "_")}_${academicYear.replace("/", "-")}.pdf`;

  return (
    <PDFDownloadLink
      document={
        <TerminalReportDocument
          report={report}
          school={school}
          config={safeConfig}
          term={term}
          academicYear={academicYear}
          className={className}
          noOnRoll={noOnRoll}
        />
      }
      fileName={fileName}
    >
      {({ loading }) => (
        <Button variant="outline" size="sm" disabled={loading}>
          <Download className="mr-2 h-4 w-4" />
          {loading ? "Compiling..." : "Download PDF"}
        </Button>
      )}
    </PDFDownloadLink>
  );
}
