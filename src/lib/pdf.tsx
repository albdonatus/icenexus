import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
  Image,
} from "@react-pdf/renderer";
import type { ActionStatus, ActionType } from "@prisma/client";
import { formatDate, formatDateTime } from "@/lib/utils";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#2563eb",
    paddingBottom: 12,
  },
  title: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#2563eb",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: "#6b7280",
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#1e40af",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  infoItem: {
    width: "48%",
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 8,
    color: "#6b7280",
    textTransform: "uppercase",
    marginBottom: 1,
  },
  infoValue: {
    fontSize: 10,
  },
  componentBlock: {
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 4,
  },
  componentHeader: {
    backgroundColor: "#eff6ff",
    padding: "6 10",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  componentName: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#1e40af",
  },
  actionRow: {
    flexDirection: "row",
    padding: "5 10",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    alignItems: "flex-start",
  },
  actionStatus: {
    width: 24,
    fontSize: 11,
    marginRight: 6,
    marginTop: -1,
  },
  actionContent: {
    flex: 1,
  },
  actionDescription: {
    fontSize: 9,
  },
  actionObservation: {
    fontSize: 8,
    color: "#6b7280",
    marginTop: 2,
    fontStyle: "italic",
  },
  statusDone: { color: "#16a34a" },
  statusNotDone: { color: "#dc2626" },
  statusNA: { color: "#9ca3af" },
  photoRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 4 },
  photo: { width: 64, height: 64, borderRadius: 3, objectFit: "cover" },
  footer: {
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 8,
    color: "#9ca3af",
  },
});

function textStatusIcon(status: ActionStatus): string {
  if (status === "DONE") return "✓";
  if (status === "NOT_DONE") return "✗";
  return "—";
}

function textStatusLabel(status: ActionStatus): string {
  if (status === "DONE") return "Realizado";
  if (status === "NOT_DONE") return "Não Realizado";
  return "N/A";
}

function textStatusStyle(status: ActionStatus) {
  if (status === "DONE") return styles.statusDone;
  if (status === "NOT_DONE") return styles.statusNotDone;
  return styles.statusNA;
}

interface PdfOrderData {
  id: string;
  scheduledDate: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  notes: string | null;
  status: string;
  client: { name: string; document?: string | null; email?: string | null; phone?: string | null };
  equipment: { name: string; type: string; brand?: string | null; model?: string | null; serialNumber?: string | null };
  technician: { name: string };
  template: {
    name: string;
    components: {
      id: string;
      name: string;
      actions: {
        id: string;
        description: string;
        type: ActionType;
      }[];
    }[];
  };
  executions: {
    actionId: string;
    status: ActionStatus | null;
    numberValue: number | null;
    unit: string | null;
    booleanValue: boolean | null;
    observation: string | null;
    photos: { id: string; url: string }[];
  }[];
}

function OrderDocument({ order }: { order: PdfOrderData }) {
  const executionMap = new Map(order.executions.map((e) => [e.actionId, e]));

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>ICE NEXUS</Text>
          <Text style={styles.subtitle}>Relatório de Ordem de Serviço</Text>
        </View>

        {/* Order Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados da Ordem</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Nº da Ordem</Text>
              <Text style={styles.infoValue}>{order.id.slice(-8).toUpperCase()}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Data Agendada</Text>
              <Text style={styles.infoValue}>{formatDate(order.scheduledDate)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Iniciada em</Text>
              <Text style={styles.infoValue}>{order.startedAt ? formatDateTime(order.startedAt) : "—"}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Concluída em</Text>
              <Text style={styles.infoValue}>{order.completedAt ? formatDateTime(order.completedAt) : "—"}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Técnico Responsável</Text>
              <Text style={styles.infoValue}>{order.technician.name}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Modelo de Checklist</Text>
              <Text style={styles.infoValue}>{order.template.name}</Text>
            </View>
          </View>
          {order.notes && (
            <View style={{ marginTop: 6 }}>
              <Text style={styles.infoLabel}>Observações do Gestor</Text>
              <Text style={styles.infoValue}>{order.notes}</Text>
            </View>
          )}
        </View>

        {/* Client */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cliente</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Nome</Text>
              <Text style={styles.infoValue}>{order.client.name}</Text>
            </View>
            {order.client.document && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>CNPJ/CPF</Text>
                <Text style={styles.infoValue}>{order.client.document}</Text>
              </View>
            )}
            {order.client.phone && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Telefone</Text>
                <Text style={styles.infoValue}>{order.client.phone}</Text>
              </View>
            )}
            {order.client.email && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{order.client.email}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Equipment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Equipamento</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Nome</Text>
              <Text style={styles.infoValue}>{order.equipment.name}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Tipo</Text>
              <Text style={styles.infoValue}>{order.equipment.type}</Text>
            </View>
            {order.equipment.brand && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Marca</Text>
                <Text style={styles.infoValue}>{order.equipment.brand}</Text>
              </View>
            )}
            {order.equipment.model && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Modelo</Text>
                <Text style={styles.infoValue}>{order.equipment.model}</Text>
              </View>
            )}
            {order.equipment.serialNumber && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Número de Série</Text>
                <Text style={styles.infoValue}>{order.equipment.serialNumber}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Checklist */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Checklist Executado</Text>
          {order.template.components.map((component) => (
            <View key={component.id} style={styles.componentBlock}>
              <View style={styles.componentHeader}>
                <Text style={styles.componentName}>{component.name}</Text>
              </View>
              {component.actions.map((action, idx) => {
                const exec = executionMap.get(action.id);
                const isLast = idx === component.actions.length - 1;

                let iconText = "—";
                let iconStyle = styles.statusNA;
                let valueText: string | null = null;

                if (action.type === "TEXT" && exec?.status) {
                  iconText = textStatusIcon(exec.status);
                  iconStyle = textStatusStyle(exec.status);
                  valueText = textStatusLabel(exec.status);
                } else if (action.type === "NUMBER") {
                  iconText = exec?.numberValue != null ? "●" : "—";
                  iconStyle = exec?.numberValue != null ? styles.statusDone : styles.statusNA;
                  valueText = exec?.numberValue != null ? `${exec.numberValue} ${exec.unit ?? ""}` : "Não preenchido";
                } else if (action.type === "BOOLEAN") {
                  if (exec?.booleanValue === true) { iconText = "✓"; iconStyle = styles.statusDone; valueText = "Sim"; }
                  else if (exec?.booleanValue === false) { iconText = "✗"; iconStyle = styles.statusNotDone; valueText = "Não"; }
                  else { valueText = "Não preenchido"; }
                }

                return (
                  <View
                    key={action.id}
                    style={[styles.actionRow, isLast ? { borderBottomWidth: 0 } : {}]}
                  >
                    <Text style={[styles.actionStatus, iconStyle]}>{iconText}</Text>
                    <View style={styles.actionContent}>
                      <Text style={styles.actionDescription}>{action.description}</Text>
                      {valueText && action.type !== "TEXT" && (
                        <Text style={[styles.actionObservation, { color: "#374151" }]}>{valueText}</Text>
                      )}
                      {exec?.observation && (
                        <Text style={styles.actionObservation}>Obs: {exec.observation}</Text>
                      )}
                      {exec?.photos && exec.photos.length > 0 && (
                        <View style={styles.photoRow}>
                          {exec.photos.map((photo) => (
                            <Image key={photo.id} src={photo.url} style={styles.photo} />
                          ))}
                        </View>
                      )}
                    </View>
                    {action.type === "TEXT" && valueText && (
                      <Text style={[styles.actionObservation, { marginLeft: 8, marginTop: 0 }]}>{valueText}</Text>
                    )}
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Ice Nexus — Sistema de Gestão de Manutenção</Text>
          <Text style={styles.footerText}>Gerado em {formatDateTime(new Date())}</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function generateOrderPdf(order: PdfOrderData): Promise<Buffer> {
  const buffer = await renderToBuffer(<OrderDocument order={order} />);
  return buffer as Buffer;
}

// ── Checklist Template (blank) PDF ──────────────────────────────────────────

interface PdfTemplateData {
  id: string;
  name: string;
  description: string | null;
  equipmentType: string | null;
  components: {
    id: string;
    name: string;
    actions: {
      id: string;
      description: string;
      type: ActionType;
      units: string[];
    }[];
  }[];
}

const tplStyles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#1a1a1a" },
  header: { marginBottom: 20, borderBottomWidth: 2, borderBottomColor: "#2563eb", paddingBottom: 12 },
  title: { fontSize: 18, fontFamily: "Helvetica-Bold", color: "#2563eb", marginBottom: 2 },
  subtitle: { fontSize: 11, color: "#6b7280" },
  meta: { flexDirection: "row", gap: 20, marginBottom: 16 },
  metaItem: {},
  metaLabel: { fontSize: 8, color: "#6b7280", textTransform: "uppercase", marginBottom: 1 },
  metaValue: { fontSize: 10 },
  componentBlock: { marginBottom: 10, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 4 },
  componentHeader: { backgroundColor: "#eff6ff", padding: "6 10", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  componentName: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#1e40af" },
  actionRow: { flexDirection: "row", padding: "6 10", borderBottomWidth: 1, borderBottomColor: "#f3f4f6", alignItems: "flex-start", gap: 8 },
  actionDesc: { flex: 1, fontSize: 9 },
  checkbox: { width: 14, height: 14, borderWidth: 1, borderColor: "#9ca3af", borderRadius: 2, marginTop: 0.5, flexShrink: 0 },
  fieldBox: { width: 80, borderBottomWidth: 1, borderBottomColor: "#9ca3af", height: 14, flexShrink: 0 },
  fieldUnit: { fontSize: 8, color: "#6b7280", marginLeft: 2, marginTop: 3 },
  boolRow: { flexDirection: "row", gap: 6, alignItems: "center", flexShrink: 0 },
  boolLabel: { fontSize: 8, color: "#374151" },
  signArea: { marginTop: 28, flexDirection: "row", justifyContent: "space-between" },
  signBlock: { width: "45%", borderTopWidth: 1, borderTopColor: "#374151", paddingTop: 4 },
  signLabel: { fontSize: 8, color: "#6b7280", textAlign: "center" },
  footer: { marginTop: 16, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#e5e7eb", flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 8, color: "#9ca3af" },
});

function TemplateDocument({ tpl }: { tpl: PdfTemplateData }) {
  return (
    <Document>
      <Page size="A4" style={tplStyles.page}>
        {/* Header */}
        <View style={tplStyles.header}>
          <Text style={tplStyles.title}>ICE NEXUS</Text>
          <Text style={tplStyles.subtitle}>Modelo de Checklist — {tpl.name}</Text>
        </View>

        {/* Meta */}
        <View style={tplStyles.meta}>
          {tpl.equipmentType && (
            <View style={tplStyles.metaItem}>
              <Text style={tplStyles.metaLabel}>Tipo de Equipamento</Text>
              <Text style={tplStyles.metaValue}>{tpl.equipmentType}</Text>
            </View>
          )}
          {tpl.description && (
            <View style={tplStyles.metaItem}>
              <Text style={tplStyles.metaLabel}>Descrição</Text>
              <Text style={tplStyles.metaValue}>{tpl.description}</Text>
            </View>
          )}
          <View style={tplStyles.metaItem}>
            <Text style={tplStyles.metaLabel}>Data de Execução</Text>
            <Text style={tplStyles.metaValue}>____/____/________</Text>
          </View>
          <View style={tplStyles.metaItem}>
            <Text style={tplStyles.metaLabel}>Técnico Responsável</Text>
            <Text style={tplStyles.metaValue}>________________________________</Text>
          </View>
        </View>

        {/* Components */}
        {tpl.components.map((comp) => (
          <View key={comp.id} style={tplStyles.componentBlock}>
            <View style={tplStyles.componentHeader}>
              <Text style={tplStyles.componentName}>{comp.name}</Text>
            </View>
            {comp.actions.map((action, idx) => {
              const isLast = idx === comp.actions.length - 1;
              return (
                <View key={action.id} style={[tplStyles.actionRow, isLast ? { borderBottomWidth: 0 } : {}]}>
                  <Text style={tplStyles.actionDesc}>{action.description}</Text>
                  {action.type === "TEXT" && (
                    <View style={tplStyles.checkbox} />
                  )}
                  {action.type === "NUMBER" && (
                    <View style={{ flexDirection: "row", alignItems: "flex-end", flexShrink: 0 }}>
                      <View style={tplStyles.fieldBox} />
                      {action.units.length > 0 && (
                        <Text style={tplStyles.fieldUnit}>{action.units.join(" / ")}</Text>
                      )}
                    </View>
                  )}
                  {action.type === "BOOLEAN" && (
                    <View style={tplStyles.boolRow}>
                      <View style={tplStyles.checkbox} />
                      <Text style={tplStyles.boolLabel}>Sim</Text>
                      <View style={tplStyles.checkbox} />
                      <Text style={tplStyles.boolLabel}>Não</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ))}

        {/* Signatures */}
        <View style={tplStyles.signArea}>
          <View style={tplStyles.signBlock}>
            <Text style={tplStyles.signLabel}>Assinatura do Técnico</Text>
          </View>
          <View style={tplStyles.signBlock}>
            <Text style={tplStyles.signLabel}>Assinatura do Cliente / Responsável</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={tplStyles.footer}>
          <Text style={tplStyles.footerText}>Ice Nexus — Sistema de Gestão de Manutenção</Text>
          <Text style={tplStyles.footerText}>Gerado em {formatDateTime(new Date())}</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function generateTemplatePdf(tpl: PdfTemplateData): Promise<Buffer> {
  const buffer = await renderToBuffer(<TemplateDocument tpl={tpl} />);
  return buffer as Buffer;
}
