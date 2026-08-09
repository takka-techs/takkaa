import React from "react";
import { FileText, Printer } from "lucide-react";
import { useBranch } from "../../contexts/BranchContext";
import { useSettings } from "../../contexts/SettingsContext";

interface PrintContractTemplateProps {
  contract: any;
  componentRef: React.RefObject<HTMLDivElement>;
}

export default function PrintContractTemplate({
  contract,
  componentRef,
}: PrintContractTemplateProps) {
  const { currentBranch } = useBranch();
  const { settings } = useSettings();
  if (!contract) return null;

  return (
    <div style={{ display: "none" }}>
      <div
        ref={componentRef}
        dir="rtl"
        style={{
          padding: "40px",
          fontFamily: "Tajawal, Tahoma, Arial, sans-serif",
          color: "#000",
          backgroundColor: "#fff",
          maxWidth: "800px",
          margin: "0 auto",
          position: "relative",
        }}
        className="print-content"
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: "30px",
            borderBottom: "2px solid #333",
            paddingBottom: "20px",
          }}
        >
          <h1
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              margin: "0 0 10px 0",
            }}
          >
            عقد بيع بالتقسيط
          </h1>
          <p
            style={{
              fontSize: "18px",
              fontWeight: "bold",
              margin: "0 0 10px 0",
              color: "#1e40af",
            }}
          >
            فرع {currentBranch?.name || "الرئيسي"}
          </p>
          <p style={{ fontSize: "16px", margin: "0" }}>
            رقم العقد: {contract.id.split("-")[0].toUpperCase()}
          </p>
          <p style={{ fontSize: "14px", margin: "5px 0 0 0", color: "#555" }}>
            تاريخ التحرير:{" "}
            {new Date(
              contract.start_date || contract.created_at,
            ).toLocaleDateString("ar-EG")}
          </p>
        </div>

        <div style={{ marginBottom: "30px" }}>
          <h3
            style={{
              fontSize: "18px",
              fontWeight: "bold",
              borderBottom: "1px solid #ccc",
              paddingBottom: "5px",
            }}
          >
            الطرف الأول (البائع)
          </h3>
          <p style={{ margin: "10px 0" }}>
            <strong>الاسم:</strong> {settings.companyName || "تكة للهواتف والصيانة"} - فرع{" "}
            {currentBranch?.name || "الرئيسي"}
          </p>
          {/* Add more seller details if needed */}
        </div>

        <div style={{ marginBottom: "30px" }}>
          <h3
            style={{
              fontSize: "18px",
              fontWeight: "bold",
              borderBottom: "1px solid #ccc",
              paddingBottom: "5px",
            }}
          >
            الطرف الثاني (المشتري)
          </h3>
          <p style={{ margin: "10px 0" }}>
            <strong>الاسم:</strong> {contract.client?.name || contract.clients?.name || "غير محدد"}
          </p>
          {(contract.client?.phone || contract.clients?.phone) && (
            <p style={{ margin: "10px 0" }}>
              <strong>رقم الهاتف:</strong> {contract.client?.phone || contract.clients?.phone}
            </p>
          )}
        </div>

        {contract.guarantor_name && (
          <div style={{ marginBottom: "30px" }}>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                borderBottom: "1px solid #ccc",
                paddingBottom: "5px",
              }}
            >
              الضامن
            </h3>
            <p style={{ margin: "10px 0" }}>
              <strong>الاسم:</strong> {contract.guarantor_name}
            </p>
            <p style={{ margin: "10px 0" }}>
              <strong>رقم الهاتف:</strong> {contract.guarantor_phone || "غير محدد"}
            </p>
            {contract.guarantor_national_id && (
              <p style={{ margin: "10px 0" }}>
                <strong>الرقم القومي:</strong> {contract.guarantor_national_id}
              </p>
            )}
            {contract.guarantor_address && (
              <p style={{ margin: "10px 0" }}>
                <strong>العنوان:</strong> {contract.guarantor_address}
              </p>
            )}
          </div>
        )}

        <div style={{ marginBottom: "30px" }}>
          <h3
            style={{
              fontSize: "18px",
              fontWeight: "bold",
              borderBottom: "1px solid #ccc",
              paddingBottom: "5px",
            }}
          >
            بيانات الصنف
          </h3>
          <p style={{ margin: "10px 0" }}>
            مواصفات الصنف المباع للطرف الثاني بالتقسيط:
          </p>
          <p style={{ margin: "10px 0" }}>
            <strong>البيان:</strong>{" "}
            {contract.item_name ||
              contract.device?.name ||
              contract.device?.model ||
              "هاتف محمول"}
          </p>
        </div>

        <div style={{ marginBottom: "30px" }}>
          <h3
            style={{
              fontSize: "18px",
              fontWeight: "bold",
              borderBottom: "1px solid #ccc",
              paddingBottom: "5px",
            }}
          >
            البيانات المالية
          </h3>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: "10px",
            }}
          >
            <tbody>
              <tr>
                <td style={{ padding: "8px", border: "1px solid #ccc" }}>
                  <strong>إجمالي قيمة العقد:</strong>
                </td>
                <td style={{ padding: "8px", border: "1px solid #ccc" }}>
                  {contract.total_price} جنيه
                </td>
                <td style={{ padding: "8px", border: "1px solid #ccc" }}>
                  <strong>الدفعة المقدمة:</strong>
                </td>
                <td style={{ padding: "8px", border: "1px solid #ccc" }}>
                  {contract.down_payment} جنيه
                </td>
              </tr>
              <tr>
                <td style={{ padding: "8px", border: "1px solid #ccc" }}>
                  <strong>قيمة القسط الشهري:</strong>
                </td>
                <td style={{ padding: "8px", border: "1px solid #ccc" }}>
                  {contract.installment_amount} جنيه
                </td>
                <td style={{ padding: "8px", border: "1px solid #ccc" }}>
                  <strong>عدد الأقساط:</strong>
                </td>
                <td style={{ padding: "8px", border: "1px solid #ccc" }}>
                  {contract.installment_count} شهر
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          style={{ marginBottom: "40px", fontSize: "14px", lineHeight: "1.6" }}
        >
          <h3
            style={{
              fontSize: "18px",
              fontWeight: "bold",
              borderBottom: "1px solid #ccc",
              paddingBottom: "5px",
              marginBottom: "15px",
            }}
          >
            الشروط والأحكام
          </h3>
          <ol style={{ paddingInlineStart: "20px" }}>
            <li style={{ marginBottom: "10px" }}>
              يقر الطرف الثاني (المشتري) بأنه استلم الصنف المذكور أعلاه بحالة
              جيدة وخالٍ من العيوب.
            </li>
            <li style={{ marginBottom: "10px" }}>
              يلتزم الطرف الثاني بسداد قيمة الأقساط في الأوقات المحددة دون
              تأخير، وفي حالة التأخير يحق للطرف الأول اتخاذ الإجراءات القانونية
              اللازمة.
            </li>
            <li style={{ marginBottom: "10px" }}>
              يعتبر هذا العقد ساري المفعول وملزماً للطرفين بمجرد التوقيع عليه.
            </li>
          </ol>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "60px",
            padding: "0 40px",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <p style={{ fontWeight: "bold", marginBottom: "40px" }}>
              توقيع الطرف الأول (البائع)
            </p>
            <p>.......................................</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontWeight: "bold", marginBottom: "40px" }}>
              توقيع الطرف الثاني (المشتري)
            </p>
            <p>.......................................</p>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            left: "0",
            right: "0",
            textAlign: "center",
            fontSize: "12px",
            color: "#888",
            borderTop: "1px solid #eee",
            paddingTop: "10px",
          }}
        >
          نظام {settings.companyName || "تكة للهواتف والصيانة"} - تم إصداره آلياً
        </div>

        {/* We add page breaking CSS for print */}
        <style>
          {`
            @media print {
              body * {
                visibility: hidden;
              }
              .print-content, .print-content * {
                visibility: visible;
              }
              .print-content {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
              }
              @page {
                size: A4;
                margin: 20mm;
              }
            }
          `}
        </style>
      </div>
    </div>
  );
}
