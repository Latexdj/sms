"use client";

import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Image } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

// PDF Global Vector Styles
const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 12, fontFamily: "Helvetica" },
  header: { borderBottom: "1 solid #e5e7eb", paddingBottom: 10, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "bold", color: "#111827" },
  subtitle: { fontSize: 11, color: "#6b7280", marginTop: 4 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  label: { color: "#6b7280", fontSize: 10 },
  value: { color: "#111827", fontSize: 12, fontWeight: "bold" },
  totalSection: { marginTop: 30, borderTop: "2 solid #111827", paddingTop: 10 },
  totalText: { fontSize: 14, fontWeight: "bold" },
  footer: { position: "absolute", bottom: 30, left: 30, right: 30, textAlign: "center", color: "#9ca3af", fontSize: 9 }
});

// React PDF Document Schema
const ReceiptDocument = ({ payment, invoice, schoolName }: any) => (
  <Document>
    <Page size="A5" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>{schoolName.toUpperCase()}</Text>
        <Text style={styles.subtitle}>OFFICIAL PAYMENT RECEIPT</Text>
      </View>

      <View style={styles.row}>
        <View>
          <Text style={styles.label}>Receipt No.</Text>
          <Text style={styles.value}>{payment.id.toUpperCase().slice(-8)}</Text>
        </View>
        <View>
          <Text style={styles.label}>Date</Text>
          <Text style={styles.value}>{new Date(payment.paid_at).toLocaleDateString()}</Text>
        </View>
      </View>

      <View style={styles.row}>
        <View>
          <Text style={styles.label}>Student ID / External Ref</Text>
          <Text style={styles.value}>{invoice.student_id ? invoice.student_id.slice(-8).toUpperCase() : "N/A"}</Text>
        </View>
        <View>
          <Text style={styles.label}>Term</Text>
          <Text style={styles.value}>{invoice.term} {invoice.academic_year}</Text>
        </View>
      </View>

      <View style={styles.row}>
        <View>
          <Text style={styles.label}>Payment Method</Text>
          <Text style={styles.value}>{payment.method}</Text>
        </View>
        <View>
          <Text style={styles.label}>Reference Num</Text>
          <Text style={styles.value}>{payment.reference || "N/A"}</Text>
        </View>
      </View>

      <View style={styles.totalSection}>
        <View style={styles.row}>
          <Text style={styles.label}>Amount Billed:</Text>
          <Text style={styles.value}>GHS {Number(invoice.total_amount).toFixed(2)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.totalText}>AMOUNT PAID:</Text>
          <Text style={styles.totalText}>GHS {Number(payment.amount).toFixed(2)}</Text>
        </View>
      </View>

      <Text style={styles.footer}>This is a system-generated receipt. Thank you for your payment!</Text>
    </Page>
  </Document>
);

// Wrapper Component mapping Document to a DOM Download Link
export function ReceiptDownloadButton({ 
  payment, 
  invoice, 
  schoolName = "SchoolMS Hub" 
}: { 
  payment: any; 
  invoice: any; 
  schoolName?: string; 
}) {
  return (
    <PDFDownloadLink
      document={<ReceiptDocument payment={payment} invoice={invoice} schoolName={schoolName} />}
      fileName={`receipt_${payment.id.slice(-8)}.pdf`}
    >
      {({ loading }) => (
        <Button variant="outline" size="sm" disabled={loading}>
          <Download className="mr-2 h-4 w-4" />
          {loading ? "Compiling PDF..." : "Download Receipt"}
        </Button>
      )}
    </PDFDownloadLink>
  );
}
