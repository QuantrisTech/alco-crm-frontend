export default function DownloadInvoice(invoice: any, user: any) {
  // ── Installment rows ──────────────────────────────────────
  const installmentRows = (invoice.installments || []).map((inst: any, idx: number) => {
    const isPaid    = inst.status === "PAID";
    const isOverdue = inst.status === "OVERDUE";
    const statusBg  = isPaid ? "#dcfce7" : isOverdue ? "#fee2e2" : "#f1f5f9";
    const statusClr = isPaid ? "#16a34a" : isOverdue ? "#dc2626" : "#64748b";
    const statusTxt = isPaid ? "✓ Paid"  : isOverdue ? "Overdue" : "Pending";
    const rowBg     = idx % 2 === 0 ? "#ffffff" : "#f9fafb";

    return `
    <tr style="background:${rowBg};">
      <td style="padding:12px 16px;font-size:13px;color:#4a5060;border-bottom:1px solid #dde2ec;">${idx + 1}</td>
      <td style="padding:12px 16px;font-size:13px;font-weight:600;color:#0f1117;border-bottom:1px solid #dde2ec;">${inst.label || `Installment ${idx + 1}`}</td>
      <td style="padding:12px 16px;font-size:13px;color:#4a5060;font-family:'Courier New',monospace;border-bottom:1px solid #dde2ec;">
        ${inst.dueDate ? new Date(inst.dueDate).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) : "—"}
      </td>
      <td style="padding:12px 16px;border-bottom:1px solid #dde2ec;">
        <span style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;background:${statusBg};color:${statusClr};">
          ${statusTxt}
        </span>
      </td>
      <td style="padding:12px 16px;text-align:right;font-size:13px;font-weight:700;font-family:'Courier New',monospace;color:#0f1117;border-bottom:1px solid #dde2ec;">
        Rs ${inst.amount?.toLocaleString()}
      </td>
    </tr>`;
  }).join("");

  // ── Helpers ───────────────────────────────────────────────
  const fmtDate = (d: string) =>
    d ? new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) : "—";

  const statusMap: Record<string, string> = {
    PAID: "Paid", PARTIAL: "Partial", PENDING: "Pending",
    OVERDUE: "Overdue", EXTENDED: "Extended", BLOCKED: "Blocked",
  };

  // ── Advance installment ───────────────────────────────────
  const advanceInst = invoice.installments?.find((i: any) => i.isAdvance);

  // ── Build HTML using the exact template ──────────────────
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Invoice — ${invoice.invoiceNumber || invoice._id?.slice(-6).toUpperCase()}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:Georgia,serif;">

<div style="width:100%;max-width:860px;margin:0 auto;background:#ffffff;">

  <!-- HEADER -->
  <div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%);padding:36px 44px 30px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="vertical-align:top;">
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="vertical-align:middle;">
                <div style="width:64px;height:64px;background:rgba(200,168,75,0.15);border:2px solid #c8a84b;border-radius:10px;margin:0 auto 20px;line-height:64px;text-align:center;font-size:18px;color:#c8a84b">ALCO</div>
              </td>
              <td style="vertical-align:middle;padding-left:12px;">
                <img src="https://res.cloudinary.com/dmbpjv9e8/image/upload/h_110,q_100,f_auto/v1777543091/logo-white_xg7uyj.webp" alt="Arslan Larik & Company" style="height:40px;width:auto;display:block;" />
                <div style="font-size:11px;color:#94a3b8;font-weight:400;letter-spacing:0.12em;text-transform:uppercase;margin-top:2px;">Academy of Life Coaching</div>
              </td>
            </tr>
          </table>
          <div style="font-size:11.5px;color:#94a3b8;line-height:1.7;margin-top:14px;">
            Karachi, Pakistan<br/>
            info@alco.com &nbsp;|&nbsp; +92 300 0000000<br/>
            www.alco.com
          </div>
        </td>
        <td style="vertical-align:top;text-align:right;">
          <div style="font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#94a3b8;margin-bottom:6px;">Invoice Number</div>
          <div style="font-family:'Courier New',monospace;font-size:26px;font-weight:600;color:#ffffff;">${invoice.invoiceNumber || invoice._id?.slice(-6).toUpperCase()}</div>
          <div style="display:inline-block;margin-top:10px;padding:5px 14px;border-radius:50px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;background:#fff8e8;color:#b07800;">
            ${statusMap[invoice.status] || invoice.status}
          </div>
        </td>
      </tr>
    </table>
  </div>

  <!-- GOLD LINE -->
  <div style="height:3px;background:linear-gradient(90deg,#c8a84b,#e8c96a,#c8a84b);"></div>

  <!-- META ROW -->
  <table width="100%" cellpadding="0" cellspacing="0" style="border-bottom:1px solid #dde2ec;">
    <tr>
      <td style="padding:22px 28px;border-right:1px solid #dde2ec;width:33%;">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#8a92a6;margin-bottom:5px;">Issue Date</div>
        <div style="font-family:'Courier New',monospace;font-size:13px;font-weight:700;color:#0f1117;">${fmtDate(invoice.createdAt)}</div>
      </td>
      <td style="padding:22px 28px;border-right:1px solid #dde2ec;width:33%;">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#8a92a6;margin-bottom:5px;">Advance Due Date</div>
        <div style="font-family:'Courier New',monospace;font-size:13px;font-weight:700;color:#0f1117;">${fmtDate(advanceInst?.dueDate || invoice.dueDate)}</div>
      </td>
      <td style="padding:22px 28px;width:33%;">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#8a92a6;margin-bottom:5px;">Enrollment ID</div>
        <div style="font-family:'Courier New',monospace;font-size:11px;color:#4a5060;">${invoice.enrollment?._id || "—"}</div>
      </td>
    </tr>
  </table>

  <!-- BODY -->
  <div style="padding:32px 44px;">

    <!-- PARTIES -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td style="width:48%;vertical-align:top;padding-right:12px;">
          <div style="background:#f4f6fb;border-radius:14px;padding:20px 22px;border:1px solid #dde2ec;">
            <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.13em;color:#8a92a6;margin-bottom:12px;">
              <span style="display:inline-block;width:16px;height:2px;background:#c8a84b;border-radius:2px;vertical-align:middle;margin-right:7px;"></span>
              Billed To
            </div>
            <div style="font-size:15px;font-weight:800;color:#0f1117;margin-bottom:5px;text-transform:capitalize;">
              ${user?.name || invoice.user?.name || "—"}
            </div>
            <div style="font-size:12px;color:#4a5060;line-height:1.8;">
              ${user?.email || invoice.user?.email || "—"}<br/>
              <span style="font-weight:600;color:#0f1117;">${user?.phone || "—"}</span>
            </div>
          </div>
        </td>
        <td style="width:4%;"></td>
        <td style="width:48%;vertical-align:top;padding-left:12px;">
          <div style="background:#f4f6fb;border-radius:14px;padding:20px 22px;border:1px solid #dde2ec;">
            <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.13em;color:#8a92a6;margin-bottom:12px;">
              <span style="display:inline-block;width:16px;height:2px;background:#c8a84b;border-radius:2px;vertical-align:middle;margin-right:7px;"></span>
              Issued By
            </div>
            <div style="font-size:15px;font-weight:800;color:#0f1117;margin-bottom:5px;">ALCO — Finance Dept.</div>
            <div style="font-size:12px;color:#4a5060;line-height:1.8;">
              finance@alco.com
            </div>
          </div>
        </td>
      </tr>
    </table>

    <!-- PROGRAM BAND -->
    <div style="background:#e8f0f8;border:1px solid #c5d8ee;border-radius:12px;padding:14px 20px;margin-bottom:28px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="width:36px;vertical-align:middle;">
            <div style="width:36px;height:36px;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%);border-radius:9px;text-align:center;line-height:36px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
              </svg>
            </div>
          </td>
          <td style="vertical-align:middle;padding-left:14px;">
            <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#1a3a5c;margin-bottom:2px;">Enrolled Program</div>
            <div style="font-size:14px;font-weight:800;color:#1a3a5c;">${invoice.enrollment?.program?.name || "—"}</div>
          </td>
        </tr>
      </table>
    </div>

    <!-- PAYMENT SCHEDULE TABLE -->
    <div style="margin-bottom:28px;">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#8a92a6;margin-bottom:12px;">Payment Schedule</div>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #dde2ec;border-radius:12px;overflow:hidden;border-collapse:collapse;">
        <thead>
          <tr style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%);">
            <th style="padding:12px 16px;text-align:left;font-size:10.5px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#94a3b8;width:40px;">#</th>
            <th style="padding:12px 16px;text-align:left;font-size:10.5px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#94a3b8;">Description</th>
            <th style="padding:12px 16px;text-align:left;font-size:10.5px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#94a3b8;">Due Date</th>
            <th style="padding:12px 16px;text-align:left;font-size:10.5px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#94a3b8;">Status</th>
            <th style="padding:12px 16px;text-align:right;font-size:10.5px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#94a3b8;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${installmentRows}
        </tbody>
      </table>
    </div>

    <!-- TOTALS -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td></td>
        <td style="width:320px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #dde2ec;border-radius:14px;overflow:hidden;border-collapse:collapse;">
            <tr style="border-bottom:1px solid #dde2ec;">
              <td style="padding:11px 18px;font-size:13px;color:#4a5060;font-weight:500;">Subtotal</td>
              <td style="padding:11px 18px;text-align:right;font-family:'Courier New',monospace;font-weight:600;color:#0f1117;font-size:13px;">Rs ${invoice.totalAmount?.toLocaleString()}</td>
            </tr>
            <tr style="border-bottom:1px solid #dde2ec;">
              <td style="padding:11px 18px;font-size:13px;color:#4a5060;font-weight:500;">Amount Paid</td>
              <td style="padding:11px 18px;text-align:right;font-family:'Courier New',monospace;font-weight:600;color:#1a8a57;font-size:13px;">Rs ${invoice.paidAmount?.toLocaleString()}</td>
            </tr>
            <tr style="border-bottom:1px solid #dde2ec;">
              <td style="padding:11px 18px;font-size:13px;color:#4a5060;font-weight:500;">Outstanding Balance</td>
              <td style="padding:11px 18px;text-align:right;font-family:'Courier New',monospace;font-weight:600;color:#c94040;font-size:13px;">Rs ${invoice.remainingAmount?.toLocaleString()}</td>
            </tr>
            <tr style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%);">
              <td style="padding:11px 18px;font-size:14px;color:#94a3b8;font-weight:600;">Total Invoice Amount</td>
              <td style="padding:11px 18px;text-align:right;font-family:'Courier New',monospace;font-weight:700;color:#ffffff;font-size:15px;">Rs ${invoice.totalAmount?.toLocaleString()}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- NOTES -->
    <div style="background:#f4f6fb;border:1px solid #dde2ec;border-radius:12px;padding:16px 20px;margin-bottom:32px;">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#8a92a6;margin-bottom:6px;">Terms &amp; Notes</div>
      <div style="font-size:13px;color:#4a5060;line-height:1.6;">
        Advance payment of <strong style="color:#0f1117;">Rs ${advanceInst?.amount?.toLocaleString() || "—"}</strong> must be received by
        <strong style="color:#0f1117;">${fmtDate(advanceInst?.dueDate || invoice.dueDate)}</strong> to activate enrollment.
        Remaining installments are due monthly as per schedule above.
        Late payments may result in restricted portal access.
        For queries contact: <strong style="color:#0f1117;">finance@alco.com</strong>
      </div>
    </div>

  </div>

  <!-- FOOTER -->
  <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #dde2ec;background:#f4f6fb;">
    <tr>
      <td style="padding:22px 44px;vertical-align:middle;">
        <div style="font-size:12px;font-weight:700;color:#4a5060;margin-bottom:2px;">Payment Methods Accepted</div>
        <div style="font-size:11px;color:#8a92a6;line-height:1.7;">
          Cash &nbsp;|&nbsp; Bank Transfer &nbsp;|&nbsp; Cheque<br/>
          Account: ALCO Academy &nbsp;|&nbsp; HBL: 0123-456789-01
        </div>
      </td>
      <td style="padding:22px 44px;text-align:right;vertical-align:middle;">
        <div style="font-size:13px;font-weight:800;color:#1a3a5c;letter-spacing:-0.02em;">ALCO</div>
        <div style="font-size:11px;color:#8a92a6;margin-top:4px;">This is a system-generated invoice.<br/>No signature required.</div>
      </td>
    </tr>
  </table>

</div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `Invoice-${invoice.invoiceNumber || invoice._id?.slice(-6)}.html`;
  a.click();
  URL.revokeObjectURL(url);
}