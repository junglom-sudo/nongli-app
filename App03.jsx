// 商業版 PDF 封面＋全年輸出版 App.jsx
// 需先安裝：npm install lunar-javascript opencc-js jspdf html2canvas

import { useMemo, useRef, useState } from "react";
import { Solar } from "lunar-javascript";
import * as OpenCC from "opencc-js";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const toTraditional = OpenCC.Converter({ from: "cn", to: "tw" });

function fixTraditional(text) {
  return text
    .replace(/母仓/g, "母倉")
    .replace(/天仓/g, "天倉")
    .replace(/仓/g, "倉")
    .replace(/龙/g, "龍")
    .replace(/鸣/g, "鳴")
    .replace(/醜/g, "丑");
}

function toTwText(value) {
  if (value === null || value === undefined || value === "") return "";
  return fixTraditional(toTraditional(String(value)));
}

const PURPOSE_LABELS = {
  marriage: "結婚",
  moving: "搬家",
  business: "開工",
};

const CHINESE_MONTHS = [
  "一月",
  "二月",
  "三月",
  "四月",
  "五月",
  "六月",
  "七月",
  "八月",
  "九月",
  "十月",
  "十一月",
  "十二月",
];

const ZODIAC_BY_YEAR_BRANCH = {
  子: "鼠",
  丑: "牛",
  寅: "虎",
  卯: "兔",
  辰: "龍",
  巳: "蛇",
  午: "馬",
  未: "羊",
  申: "猴",
  酉: "雞",
  戌: "狗",
  亥: "豬",
};

export default function App() {
  const today = new Date();
  const defaultYear = today.getFullYear();
  const defaultMonth = today.getMonth() + 1;
  const defaultDate = formatDateForInput(today);

  const [selectedYear, setSelectedYear] = useState(defaultYear);
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [selectedDate, setSelectedDate] = useState(defaultDate);
  const [purpose, setPurpose] = useState("marriage");
  const [copyMessage, setCopyMessage] = useState("");
  const [isExportingYear, setIsExportingYear] = useState(false);

  const pdfCoverRef = useRef(null);
  const pdfSummaryRef = useRef(null);
  const calendarPrintRef = useRef(null);
  const yearCoverRef = useRef(null);
  const yearMonthRefs = useRef([]);

  const calendarCells = useMemo(() => {
    return buildCalendarCells(selectedYear, selectedMonth, purpose);
  }, [selectedYear, selectedMonth, purpose]);

  const luckyDays = useMemo(() => {
    return calendarCells.filter(
      (item) => item.type === "day" && item.result.level === "適合"
    );
  }, [calendarCells]);

  const detailData = useMemo(() => {
    return getRealHuangliData(selectedDate);
  }, [selectedDate]);

  const detailResult = useMemo(() => {
    return evaluatePurpose(detailData, purpose);
  }, [detailData, purpose]);

  const exportText = useMemo(() => {
    return buildExportText(selectedYear, selectedMonth, purpose, luckyDays);
  }, [selectedYear, selectedMonth, purpose, luckyDays]);

  const yearlyMonths = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      cells: buildCalendarCells(selectedYear, i + 1, purpose),
    }));
  }, [selectedYear, purpose]);

  const yearZodiac = useMemo(() => {
    const solar = Solar.fromYmd(selectedYear, 1, 1);
    const lunar = solar.getLunar();
    const branch = lunar.getYearZhi ? lunar.getYearZhi() : "";
    return ZODIAC_BY_YEAR_BRANCH[branch] || "";
  }, [selectedYear]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(exportText);
      setCopyMessage("已複製吉日列表");
      setTimeout(() => setCopyMessage(""), 2000);
    } catch (error) {
      console.error(error);
      setCopyMessage("複製失敗，請手動複製");
      setTimeout(() => setCopyMessage(""), 2000);
    }
  }

  function handleDownloadTxt() {
    const blob = new Blob([exportText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${PURPOSE_LABELS[purpose]}吉日列表.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function captureCanvas(element) {
    return html2canvas(element, {
      scale: 3,
      useCORS: true,
      backgroundColor: "#ffffff",
      scrollX: 0,
      scrollY: 0,
    });
  }

  function addCanvasAsPages(pdf, canvas, isFirstPage = false) {
    const imgData = canvas.toDataURL("image/png");
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 8;
    const usableWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * usableWidth) / canvas.width;

    if (!isFirstPage) {
      pdf.addPage();
    }

    if (imgHeight <= pageHeight - margin * 2) {
      pdf.addImage(imgData, "PNG", margin, margin, usableWidth, imgHeight);
      return;
    }

    let heightLeft = imgHeight;
    let position = margin;

    pdf.addImage(imgData, "PNG", margin, position, usableWidth, imgHeight);
    heightLeft -= pageHeight - margin * 2;

    while (heightLeft > 0) {
      pdf.addPage();
      position = margin - (imgHeight - heightLeft);
      pdf.addImage(imgData, "PNG", margin, position, usableWidth, imgHeight);
      heightLeft -= pageHeight - margin * 2;
    }
  }

  async function handleDownloadPdf() {
    try {
      if (!pdfCoverRef.current || !pdfSummaryRef.current || !calendarPrintRef.current) {
        throw new Error("找不到 PDF 區塊");
      }

      const coverCanvas = await captureCanvas(pdfCoverRef.current);
      const summaryCanvas = await captureCanvas(pdfSummaryRef.current);
      const calendarCanvas = await captureCanvas(calendarPrintRef.current);

      const pdf = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: "a4",
      });

      addCanvasAsPages(pdf, coverCanvas, true);
      addCanvasAsPages(pdf, summaryCanvas, false);
      addCanvasAsPages(pdf, calendarCanvas, false);

      pdf.save(
        `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${PURPOSE_LABELS[purpose]}吉日報告-商業版.pdf`
      );
    } catch (error) {
      console.error("PDF 匯出失敗：", error);
      alert(`PDF 匯出失敗：${error?.message || error}`);
    }
  }

  async function handleDownloadYearPdf() {
    try {
      setIsExportingYear(true);

      if (!yearCoverRef.current || !yearMonthRefs.current.length) {
        throw new Error("找不到全年 PDF 區塊");
      }

      const pdf = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: "a4",
      });

      const coverCanvas = await captureCanvas(yearCoverRef.current);
      addCanvasAsPages(pdf, coverCanvas, true);

      for (let i = 0; i < yearMonthRefs.current.length; i += 1) {
        const el = yearMonthRefs.current[i];
        if (!el) continue;
        const canvas = await captureCanvas(el);
        addCanvasAsPages(pdf, canvas, false);
      }

      pdf.save(`${selectedYear}-${PURPOSE_LABELS[purpose]}全年農民曆-商業版.pdf`);
    } catch (error) {
      console.error("全年 PDF 匯出失敗：", error);
      alert(`全年 PDF 匯出失敗：${error?.message || error}`);
    } finally {
      setIsExportingYear(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <h1 style={styles.title}>今日農民曆</h1>
          <p style={styles.subtitle}>商業版｜封面 PDF ＋ 全年輸出</p>
        </header>

        <section style={styles.card}>
          <div style={styles.sectionTitle}>查詢條件</div>

          <div style={styles.controlGrid}>
            <div style={styles.controlBlock}>
              <label style={styles.label}>年份：</label>
              <select
                value={selectedYear}
                onChange={(e) => {
                  const year = Number(e.target.value);
                  setSelectedYear(year);
                  setSelectedDate(`${year}-${String(selectedMonth).padStart(2, "0")}-01`);
                }}
                style={styles.select}
              >
                {buildYearOptions(defaultYear).map((year) => (
                  <option key={year} value={year}>
                    {year} 年
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.controlBlock}>
              <label style={styles.label}>月份：</label>
              <select
                value={selectedMonth}
                onChange={(e) => {
                  const month = Number(e.target.value);
                  setSelectedMonth(month);
                  setSelectedDate(`${selectedYear}-${String(month).padStart(2, "0")}-01`);
                }}
                style={styles.select}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                  <option key={month} value={month}>
                    {month} 月
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.controlBlock}>
              <label style={styles.label}>用途：</label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                style={styles.select}
              >
                <option value="marriage">結婚吉日</option>
                <option value="moving">搬家吉日</option>
                <option value="business">開工吉日</option>
              </select>
            </div>
          </div>
        </section>

        <section style={{ ...styles.card, ...styles.exportCard }}>
          <div style={styles.sectionTitle}>商業版匯出</div>

          <div style={styles.exportSummary}>
            <div style={styles.exportBadge}>
              本月 {PURPOSE_LABELS[purpose]}：{luckyDays.length} 天適合
            </div>

            <div style={styles.exportActions}>
              <button style={styles.primaryButton} onClick={handleCopy}>
                複製吉日列表
              </button>
              <button style={styles.secondaryButton} onClick={handleDownloadTxt}>
                匯出 TXT
              </button>
              <button style={styles.secondaryButton} onClick={handleDownloadPdf}>
                匯出商業版 PDF
              </button>
              <button
                style={styles.secondaryButton}
                onClick={handleDownloadYearPdf}
                disabled={isExportingYear}
              >
                {isExportingYear ? "全年匯出中..." : "匯出全年 PDF"}
              </button>
            </div>
          </div>

          {copyMessage ? <div style={styles.copyMessage}>{copyMessage}</div> : null}
        </section>

        <section style={styles.card} ref={calendarPrintRef}>
          <div style={styles.sectionTitle}>
            {selectedYear} 年 {selectedMonth} 月總覽
          </div>

          <div style={styles.weekdayHeader}>
            {["日", "一", "二", "三", "四", "五", "六"].map((d) => (
              <div key={d} style={styles.weekdayCell}>
                {d}
              </div>
            ))}
          </div>

          <div style={styles.monthGrid}>
            {calendarCells.map((item, index) => {
              if (item.type === "empty") {
                return <div key={`empty-${index}`} style={styles.emptyDayCell} />;
              }

              const isRed = item.data.isWeekend || Boolean(item.data.holidayName);

              return (
                <button
                  key={item.date}
                  onClick={() => setSelectedDate(item.date)}
                  style={{
                    ...styles.dayCard,
                    ...(selectedDate === item.date ? styles.dayCardActive : {}),
                    borderColor:
                      item.result.level === "適合"
                        ? "#86efac"
                        : item.result.level === "普通"
                        ? "#fcd34d"
                        : "#fca5a5",
                    background:
                      item.result.level === "適合"
                        ? "#f0fdf4"
                        : item.result.level === "普通"
                        ? "#fffbeb"
                        : "#fef2f2",
                  }}
                >
                  <div style={styles.dayTopRow}>
                    <div
                      style={{
                        ...styles.dayNumber,
                        color: isRed ? "#dc2626" : "#111827",
                      }}
                    >
                      {item.day}
                    </div>
                    <div
                      style={{
                        ...styles.dayBadge,
                        background:
                          item.result.level === "適合"
                            ? "#dcfce7"
                            : item.result.level === "普通"
                            ? "#fef3c7"
                            : "#fee2e2",
                        color:
                          item.result.level === "適合"
                            ? "#166534"
                            : item.result.level === "普通"
                            ? "#92400e"
                            : "#991b1b",
                      }}
                    >
                      {item.result.level}
                    </div>
                  </div>

                  <div
                    style={{
                      ...styles.dayWeek,
                      color: isRed ? "#dc2626" : "#6b7280",
                    }}
                  >
                    {item.weekday}
                  </div>

                  <div
                    style={{
                      ...styles.dayLunar,
                      color: isRed ? "#dc2626" : "#374151",
                    }}
                  >
                    {item.data.lunarDate}
                  </div>

                  {item.data.holidayName ? (
                    <div style={styles.dayHoliday}>{item.data.holidayName}</div>
                  ) : null}

                  {item.data.solarTerm ? (
                    <div style={styles.daySolarTerm}>{item.data.solarTerm}</div>
                  ) : null}

                  <div style={styles.dayMiniText}>{item.result.title}</div>
                </button>
              );
            })}
          </div>
        </section>

        <section style={{ ...styles.card, ...styles.resultCard }}>
          <div style={styles.sectionTitle}>所選日期詳細判斷</div>
          <div style={styles.resultTop}>
            <div
              style={{
                ...styles.resultBadge,
                background:
                  detailResult.level === "適合"
                    ? "#dcfce7"
                    : detailResult.level === "普通"
                    ? "#fef3c7"
                    : "#fee2e2",
                color:
                  detailResult.level === "適合"
                    ? "#166534"
                    : detailResult.level === "普通"
                    ? "#92400e"
                    : "#991b1b",
              }}
            >
              {detailResult.level}
            </div>

            <div style={styles.resultTextWrap}>
              <div style={styles.resultTitle}>{detailResult.title}</div>
              <div style={styles.resultDesc}>{detailResult.description}</div>
              <div style={styles.selectedDateText}>
                所選日期：{detailData.solarDate}（{detailData.weekday}）
              </div>
            </div>
          </div>
        </section>

        <div style={styles.pdfHiddenArea}>
          <div ref={pdfCoverRef} style={styles.commercialCoverPage}>
            <div style={styles.coverBrand}>傳統曆書・商業版</div>
            <div style={styles.coverMainTitle}>{selectedYear} 農民曆</div>
            <div style={styles.coverSubTitle}>{yearZodiac ? `${yearZodiac}年・` : ""}{PURPOSE_LABELS[purpose]}吉日專冊</div>
            <div style={styles.coverBadge}>{String(selectedMonth).padStart(2, "0")} 月特輯</div>
            <div style={styles.coverFooter}>適合列印 / 收藏 / 商業販售展示</div>
          </div>

          <div ref={pdfSummaryRef} style={styles.pdfPage}>
            <div style={styles.pdfHeader}>
              <div style={styles.pdfTitle}>農民曆吉日報告</div>
              <div style={styles.pdfSubTitle}>
                {selectedYear} 年 {selectedMonth} 月｜{PURPOSE_LABELS[purpose]}
              </div>
            </div>

            <div style={styles.pdfSection}>
              <div style={styles.pdfSectionTitle}>本月吉日</div>
              {luckyDays.length === 0 ? (
                <div style={styles.pdfText}>本月沒有適合日期</div>
              ) : (
                luckyDays.map((item, index) => (
                  <div key={item.date} style={styles.pdfBullet}>
                    {index + 1}. {item.data.solarDate}（{item.data.weekday}）｜{item.data.lunarDate}｜
                    {item.result.title}
                    {item.data.holidayName ? `｜${item.data.holidayName}` : ""}
                    {item.data.solarTerm ? `｜${item.data.solarTerm}` : ""}
                  </div>
                ))
              )}
            </div>

            <div style={styles.pdfSection}>
              <div style={styles.pdfSectionTitle}>所選日期</div>
              <div style={styles.pdfText}>日期：{detailData.solarDate}</div>
              <div style={styles.pdfText}>農曆：{detailData.lunarDate}</div>
              <div style={styles.pdfText}>結果：{detailResult.title}</div>
              <div style={styles.pdfText}>說明：{detailResult.description}</div>
            </div>
          </div>

          <div ref={yearCoverRef} style={styles.commercialCoverPage}>
            <div style={styles.coverBrand}>全年典藏版</div>
            <div style={styles.coverMainTitle}>{selectedYear} 全年農民曆</div>
            <div style={styles.coverSubTitle}>{yearZodiac ? `${yearZodiac}年・` : ""}{PURPOSE_LABELS[purpose]}吉日總整理</div>
            <div style={styles.coverBadge}>12 個月份完整輸出</div>
            <div style={styles.tocWrap}>
              {yearlyMonths.map(({ month, cells }) => {
                const luckyCount = cells.filter((item) => item.type === "day" && item.result.level === "適合").length;
                return (
                  <div key={month} style={styles.tocItem}>
                    <span>{String(month).padStart(2, "0")} 月</span>
                    <span>{PURPOSE_LABELS[purpose]}吉日 {luckyCount} 天</span>
                  </div>
                );
              })}
            </div>
            <div style={styles.coverFooter}>商業展示 / 禮品列印 / 電子商品輸出</div>
          </div>

          {yearlyMonths.map(({ month, cells }, idx) => (
            <div
              key={month}
              ref={(el) => {
                yearMonthRefs.current[idx] = el;
              }}
              style={styles.yearMonthPage}
            >
              <div style={styles.yearMonthHeader}>
                <div style={styles.yearMonthTitle}>{selectedYear} 年 {month} 月</div>
                <div style={styles.yearMonthSubTitle}>{CHINESE_MONTHS[month - 1]}｜{PURPOSE_LABELS[purpose]}吉日月曆</div>
              </div>

              <div style={styles.yearWeekHeader}>
                {["日", "一", "二", "三", "四", "五", "六"].map((d) => (
                  <div key={d} style={styles.yearWeekCell}>{d}</div>
                ))}
              </div>

              <div style={styles.yearMonthGrid}>
                {cells.map((item, index) => {
                  if (item.type === "empty") {
                    return <div key={`year-empty-${month}-${index}`} style={styles.yearEmptyCell} />;
                  }

                  const isRed = item.data.isWeekend || Boolean(item.data.holidayName);

                  return (
                    <div
                      key={item.date}
                      style={{
                        ...styles.yearDayCard,
                        borderColor:
                          item.result.level === "適合"
                            ? "#86efac"
                            : item.result.level === "普通"
                            ? "#fcd34d"
                            : "#fca5a5",
                        background:
                          item.result.level === "適合"
                            ? "#f0fdf4"
                            : item.result.level === "普通"
                            ? "#fffbeb"
                            : "#fef2f2",
                      }}
                    >
                      <div style={styles.yearDayTop}>
                        <div style={{ ...styles.yearDayNumber, color: isRed ? "#dc2626" : "#111827" }}>
                          {item.day}
                        </div>
                        <div
                          style={{
                            ...styles.yearDayBadge,
                            background:
                              item.result.level === "適合"
                                ? "#dcfce7"
                                : item.result.level === "普通"
                                ? "#fef3c7"
                                : "#fee2e2",
                            color:
                              item.result.level === "適合"
                                ? "#166534"
                                : item.result.level === "普通"
                                ? "#92400e"
                                : "#991b1b",
                          }}
                        >
                          {item.result.level}
                        </div>
                      </div>
                      <div style={{ ...styles.yearDayWeek, color: isRed ? "#dc2626" : "#6b7280" }}>
                        {item.weekday}
                      </div>
                      <div style={{ ...styles.yearDayLunar, color: isRed ? "#dc2626" : "#374151" }}>
                        {item.data.lunarDate}
                      </div>
                      {item.data.holidayName ? <div style={styles.yearDayHoliday}>{item.data.holidayName}</div> : null}
                      {item.data.solarTerm ? <div style={styles.yearDaySolarTerm}>{item.data.solarTerm}</div> : null}
                      <div style={styles.yearDayText}>{item.result.title}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value }) {
  return (
    <div style={styles.infoItem}>
      <div style={styles.infoLabel}>
        <span style={styles.infoIcon}>{icon}</span>
        <span>{label}</span>
      </div>
      <div style={styles.infoValue}>{value}</div>
    </div>
  );
}

function buildExportText(year, month, purpose, luckyDays) {
  const title = `${year} 年 ${month} 月 ${PURPOSE_LABELS[purpose]}吉日列表`;
  const lines = [title, ""];

  if (luckyDays.length === 0) {
    lines.push("本月沒有篩選出適合的日期。");
    return lines.join("\n");
  }

  luckyDays.forEach((item, index) => {
    lines.push(
      `${index + 1}. ${item.data.solarDate}（${item.data.weekday}）｜${item.data.lunarDate}｜${item.result.title}${item.data.holidayName ? `｜${item.data.holidayName}` : ""}${item.data.solarTerm ? `｜${item.data.solarTerm}` : ""}`
    );
  });

  return lines.join("\n");
}

function buildYearOptions(currentYear) {
  const years = [];
  for (let y = currentYear - 2; y <= currentYear + 3; y += 1) {
    years.push(y);
  }
  return years;
}

function buildCalendarCells(year, month, purpose) {
  const totalDays = new Date(year, month, 0).getDate();
  const firstDayWeek = new Date(year, month - 1, 1).getDay();
  const cells = [];

  for (let i = 0; i < firstDayWeek; i += 1) {
    cells.push({ type: "empty" });
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const data = getRealHuangliData(date);
    const result = evaluatePurpose(data, purpose);

    cells.push({
      type: "day",
      date,
      day,
      weekday: data.weekday,
      data,
      result,
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ type: "empty" });
  }

  return cells;
}

function formatDateForInput(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDateDisplay(dateStr) {
  const [y, m, d] = dateStr.split("-");
  return `${y} / ${m} / ${d}`;
}

function getWeekday(dateStr) {
  const date = new Date(dateStr);
  const weeks = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  return weeks[date.getDay()];
}

function getTaiwanHolidayName(dateStr, lunar) {
  const [, m, d] = dateStr.split("-").map(Number);

  const solarHolidayMap = {
    "01-01": "元旦",
    "02-28": "和平紀念日",
    "04-04": "兒童節",
    "10-10": "國慶日",
    "12-25": "行憲紀念日",
  };

  const solarKey = `${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  if (solarHolidayMap[solarKey]) return solarHolidayMap[solarKey];

  const lunarMonth = lunar.getMonth();
  const lunarDay = lunar.getDay();

  if (lunarMonth === 1 && lunarDay === 1) return "春節";
  if (lunarMonth === 1 && lunarDay === 15) return "元宵節";
  if (lunarMonth === 5 && lunarDay === 5) return "端午節";
  if (lunarMonth === 7 && lunarDay === 7) return "七夕";
  if (lunarMonth === 8 && lunarDay === 15) return "中秋節";
  if (lunarMonth === 9 && lunarDay === 9) return "重陽節";
  if (lunarMonth === 12 && lunarDay === 8) return "臘八";
  if (lunarMonth === 12 && lunarDay === 24) return "送神";
  if (lunarMonth === 12 && lunarDay === 30) return "除夕";

  return "";
}

function isWeekendDate(dateStr) {
  const day = new Date(dateStr).getDay();
  return day === 0 || day === 6;
}

function splitItems(text) {
  if (!text) return [];
  return String(text)
    .split(/[.。、,，；; ]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function getRealHuangliData(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const solar = Solar.fromYmd(y, m, d);
  const lunar = solar.getLunar();

  const yi = splitItems(lunar.getDayYi ? lunar.getDayYi() : "");
  const ji = splitItems(lunar.getDayJi ? lunar.getDayJi() : "");

  const eightChar = lunar.getEightChar ? lunar.getEightChar() : null;
  const jie = lunar.getJie ? lunar.getJie() : "";
  const qi = lunar.getQi ? lunar.getQi() : "";
  const pengzuGan = lunar.getPengZuGan ? lunar.getPengZuGan() : "";
  const pengzuZhi = lunar.getPengZuZhi ? lunar.getPengZuZhi() : "";
  const dayPositionTai = lunar.getPositionTai ? lunar.getPositionTai() : "";
  const dayPositionDesc = lunar.getPositionDesc ? lunar.getPositionDesc() : "";
  const jiShen = lunar.getDayJiShen ? lunar.getDayJiShen() : [];
  const chong = lunar.getChong ? lunar.getChong() : "";
  const sha = lunar.getSha ? lunar.getSha() : "";
  const zhiXing = lunar.getZhiXing ? lunar.getZhiXing() : "";
  const nayin = lunar.getNaYin ? lunar.getNaYin() : "";

  const holidayName = getTaiwanHolidayName(dateStr, lunar);
  const isWeekend = isWeekendDate(dateStr);

  return {
    solarDate: formatDateDisplay(dateStr),
    weekday: getWeekday(dateStr),
    lunarDate: toTwText(`${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`),
    zodiac: toTwText(`${lunar.getDayShengXiao()}日沖${chong || "—"}`),
    wuxing: toTwText(
      nayin || (eightChar && eightChar.getYearWuXing ? eightChar.getYearWuXing() : "—")
    ),
    solarTerm: toTwText(jie || qi || ""),
    holidayName: toTwText(holidayName || ""),
    isWeekend,
    fortune: yi.length >= ji.length ? "吉" : "平",
    clash: toTwText(`${chong || "—"}・${sha || "—"}`),
    taishen: toTwText(
      `${dayPositionTai || ""}${dayPositionDesc ? `（${dayPositionDesc}）` : ""}` || "—"
    ),
    zhishen: toTwText(Array.isArray(jiShen) && jiShen.length ? jiShen.join("、") : "—"),
    jianchu: toTwText(zhiXing || "—"),
    pengzu: toTwText(`${pengzuGan} ${pengzuZhi}`.trim() || "—"),
    goodList: yi.length ? yi.map(toTwText) : ["無資料"],
    badList: ji.length ? ji.map(toTwText) : ["無資料"],
    goodHours: buildGoodHours(lunar),
  };
}

function buildGoodHours(lunar) {
  const times = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  const ranges = {
    子: "23:00 - 00:59",
    丑: "01:00 - 02:59",
    寅: "03:00 - 04:59",
    卯: "05:00 - 06:59",
    辰: "07:00 - 08:59",
    巳: "09:00 - 10:59",
    午: "11:00 - 12:59",
    未: "13:00 - 14:59",
    申: "15:00 - 16:59",
    酉: "17:00 - 18:59",
    戌: "19:00 - 20:59",
    亥: "21:00 - 22:59",
  };

  const luckMap = {};
  const timeList = lunar.getTimes ? lunar.getTimes() : [];

  timeList.forEach((t) => {
    const zhi = t.getZhi ? t.getZhi() : "";
    const status = t.getTianShenLuck ? t.getTianShenLuck() : "";
    luckMap[zhi] = status;
  });

  const result = times
    .filter((zhi) => {
      const status = luckMap[zhi];
      return status === "吉" || status === "貴" || status === "大吉";
    })
    .map((zhi) => ({
      time: `${zhi}時 ${ranges[zhi]}`,
      desc: "依黃曆時辰換算",
      level: toTwText(luckMap[zhi] || "吉"),
    }));

  return result.length
    ? result
    : [{ time: "—", desc: "此日未取得吉時資料", level: "—" }];
}

function containsAny(list, keywords) {
  return keywords.some((keyword) => list.includes(keyword));
}

function evaluatePurpose(data, purpose) {
  const good = data.goodList;
  const bad = data.badList;

  if (purpose === "marriage") {
    const hasGood = containsAny(good, ["嫁娶", "納采", "訂盟", "祈福"]);
    const hasBad = containsAny(bad, ["嫁娶", "破土", "安葬"]);

    if (hasGood && !hasBad) {
      return {
        level: "適合",
        title: "適合結婚",
        description: "宜中包含婚嫁相關項目，且忌中無明顯衝突。",
      };
    }

    if (!hasGood && hasBad) {
      return {
        level: "不建議",
        title: "不建議結婚",
        description: "忌中有婚嫁衝突，較不適合安排。",
      };
    }

    return {
      level: "普通",
      title: "可列入參考",
      description: "沒有明顯大凶，但婚嫁吉象不算特別強。",
    };
  }

  if (purpose === "moving") {
    const hasGood = containsAny(good, ["入宅", "移徙", "安床"]);
    const hasBad = containsAny(bad, ["入宅", "移徙", "動土", "安門"]);

    if (hasGood && !hasBad) {
      return {
        level: "適合",
        title: "適合搬家",
        description: "宜中對搬家入宅有利，忌中衝突少。",
      };
    }

    if (!hasGood && hasBad) {
      return {
        level: "不建議",
        title: "不建議搬家",
        description: "忌中與搬家用途有明顯衝突。",
      };
    }

    return {
      level: "普通",
      title: "可列入參考",
      description: "沒有大衝突，但也不是最理想日期。",
    };
  }

  const hasGood = containsAny(good, ["開市", "交易", "立券", "納財", "開工"]);
  const hasBad = containsAny(bad, ["開市", "交易", "詞訟", "訴訟"]);

  if (hasGood && !hasBad) {
    return {
      level: "適合",
      title: "適合開工",
      description: "宜中包含商務與開工相關項目，整體有利。",
    };
  }

  if (!hasGood && hasBad) {
    return {
      level: "不建議",
      title: "不建議開工",
      description: "忌中對商務用途較不利。",
    };
  }

  return {
    level: "普通",
    title: "可列入參考",
    description: "商務吉象普通，可做備選日期。",
  };
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #fff7ed 0%, #fef2f2 100%)",
    padding: "24px",
    fontFamily: "Arial, 'Microsoft JhengHei', sans-serif",
    boxSizing: "border-box",
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
  },
  header: {
    textAlign: "center",
    marginBottom: "24px",
    padding: "32px 20px",
    background: "#ffffff",
    borderRadius: "24px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
  },
  title: {
    margin: 0,
    fontSize: "58px",
    color: "#b91c1c",
    fontWeight: "bold",
  },
  subtitle: {
    marginTop: "12px",
    color: "#6b7280",
    fontSize: "22px",
  },
  card: {
    background: "#ffffff",
    borderRadius: "20px",
    padding: "24px",
    marginBottom: "20px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
  },
  exportCard: {
    border: "2px solid #bfdbfe",
  },
  sectionTitle: {
    fontSize: "30px",
    fontWeight: "bold",
    marginBottom: "18px",
    color: "#1f2937",
  },
  controlGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
  },
  controlBlock: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  label: {
    fontSize: "20px",
    color: "#374151",
  },
  select: {
    fontSize: "18px",
    padding: "10px 14px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    background: "#fff",
  },
  exportSummary: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "16px",
  },
  exportBadge: {
    background: "#dbeafe",
    color: "#1d4ed8",
    padding: "12px 16px",
    borderRadius: "999px",
    fontSize: "20px",
    fontWeight: "bold",
  },
  exportActions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },
  primaryButton: {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "12px 18px",
    fontSize: "18px",
    cursor: "pointer",
  },
  secondaryButton: {
    background: "#ffffff",
    color: "#1f2937",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    padding: "12px 18px",
    fontSize: "18px",
    cursor: "pointer",
  },
  copyMessage: {
    marginBottom: "12px",
    color: "#166534",
    fontSize: "17px",
    fontWeight: "bold",
  },
  weekdayHeader: {
    display: "grid",
    gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
    gap: "10px",
    marginBottom: "10px",
  },
  weekdayCell: {
    textAlign: "center",
    fontSize: "18px",
    fontWeight: "bold",
    color: "#374151",
    padding: "8px 0",
  },
  monthGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
    gap: "10px",
  },
  emptyDayCell: {
    minHeight: "170px",
    borderRadius: "18px",
    background: "transparent",
  },
  dayCard: {
    width: "100%",
    minHeight: "170px",
    border: "2px solid #e5e7eb",
    borderRadius: "18px",
    padding: "14px",
    textAlign: "left",
    cursor: "pointer",
    outline: "none",
    boxSizing: "border-box",
  },
  dayCardActive: {
    boxShadow: "0 0 0 3px rgba(185, 28, 28, 0.15)",
  },
  dayTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },
  dayNumber: {
    fontSize: "28px",
    fontWeight: "bold",
    color: "#111827",
  },
  dayBadge: {
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "14px",
    fontWeight: "bold",
  },
  dayWeek: {
    fontSize: "15px",
    color: "#6b7280",
    marginBottom: "6px",
  },
  dayLunar: {
    fontSize: "16px",
    color: "#374151",
    fontWeight: "bold",
    marginBottom: "6px",
  },
  dayHoliday: {
    fontSize: "14px",
    fontWeight: "bold",
    color: "#dc2626",
    marginBottom: "4px",
  },
  daySolarTerm: {
    fontSize: "14px",
    fontWeight: "bold",
    color: "#2563eb",
    marginBottom: "4px",
  },
  dayMiniText: {
    fontSize: "15px",
    color: "#4b5563",
    lineHeight: 1.5,
  },
  resultCard: {
    border: "2px solid #fde68a",
    background: "#ffffff",
    borderRadius: "20px",
    padding: "24px",
    marginBottom: "20px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
  },
  resultTop: {
    display: "flex",
    gap: "18px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  resultBadge: {
    minWidth: "120px",
    textAlign: "center",
    padding: "16px 22px",
    borderRadius: "999px",
    fontWeight: "bold",
    fontSize: "28px",
  },
  resultTextWrap: {
    flex: 1,
  },
  resultTitle: {
    fontSize: "28px",
    fontWeight: "bold",
    color: "#111827",
    marginBottom: "8px",
  },
  resultDesc: {
    fontSize: "18px",
    color: "#4b5563",
    lineHeight: 1.7,
  },
  selectedDateText: {
    marginTop: "10px",
    fontSize: "18px",
    color: "#7c2d12",
    fontWeight: "bold",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
    gap: "16px",
  },
  infoItem: {
    background: "#f9fafb",
    borderRadius: "16px",
    padding: "18px",
    border: "1px solid #ececec",
  },
  infoLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#6b7280",
    fontSize: "18px",
    marginBottom: "10px",
  },
  infoIcon: {
    fontSize: "22px",
  },
  infoValue: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#374151",
    lineHeight: 1.4,
  },
  yijiWrap: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "20px",
    marginBottom: "20px",
  },
  yijiCard: {
    borderRadius: "20px",
    padding: "24px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
  },
  yiCard: {
    background: "#ecfdf5",
  },
  jiCard: {
    background: "#fef2f2",
  },
  yijiTitle: {
    fontSize: "40px",
    marginTop: 0,
    marginBottom: "16px",
    textAlign: "center",
  },
  tagWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    justifyContent: "center",
  },
  goodTag: {
    background: "#ffffff",
    color: "#0f766e",
    padding: "10px 16px",
    borderRadius: "999px",
    fontSize: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  badTag: {
    background: "#ffffff",
    color: "#b91c1c",
    padding: "10px 16px",
    borderRadius: "999px",
    fontSize: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  hourList: {
    display: "grid",
    gap: "14px",
  },
  hourItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    padding: "18px",
    borderRadius: "16px",
    background: "#fff7ed",
    border: "1px solid #fed7aa",
  },
  hourTime: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#7c2d12",
  },
  hourDesc: {
    fontSize: "18px",
    color: "#6b7280",
    marginTop: "6px",
  },
  hourBadge: {
    background: "#f59e0b",
    color: "#fff",
    padding: "10px 16px",
    borderRadius: "999px",
    fontSize: "18px",
    fontWeight: "bold",
    whiteSpace: "nowrap",
  },
  advancedGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
    gap: "16px",
  },
  advancedItem: {
    background: "#f9fafb",
    borderRadius: "16px",
    padding: "18px",
    border: "1px solid #ececec",
  },
  advancedLabel: {
    color: "#6b7280",
    fontSize: "18px",
    marginBottom: "10px",
  },
  advancedValue: {
    color: "#111827",
    fontSize: "24px",
    fontWeight: "bold",
    lineHeight: 1.5,
  },
  pdfHiddenArea: {
    position: "fixed",
    left: "-99999px",
    top: 0,
    width: "794px",
    zIndex: -1,
  },
  pdfPage: {
    width: "794px",
    minHeight: "1123px",
    background: "#ffffff",
    color: "#111827",
    padding: "24px",
    boxSizing: "border-box",
    fontFamily: "'Microsoft JhengHei', Arial, sans-serif",
  },
  pdfHeader: {
    marginBottom: "10px",
    textAlign: "center",
  },
  pdfTitle: {
    fontSize: "32px",
    fontWeight: "bold",
    color: "#991b1b",
    marginBottom: "8px",
  },
  pdfSubTitle: {
    fontSize: "18px",
    color: "#374151",
  },
  pdfSection: {
    marginBottom: "24px",
  },
  pdfSectionTitle: {
    fontSize: "22px",
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: "12px",
  },
  pdfText: {
    fontSize: "16px",
    lineHeight: 1.8,
    marginBottom: "6px",
  },
  pdfBullet: {
    fontSize: "16px",
    lineHeight: 1.8,
    marginBottom: "6px",
  },
  commercialCoverPage: {
    width: "794px",
    minHeight: "1123px",
    background: "linear-gradient(180deg, #7f1d1d 0%, #b91c1c 45%, #f59e0b 100%)",
    color: "#fff7ed",
    padding: "72px 56px",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    fontFamily: "'Microsoft JhengHei', Arial, sans-serif",
  },
  coverBrand: {
    fontSize: "22px",
    letterSpacing: "4px",
    opacity: 0.9,
  },
  coverMainTitle: {
    fontSize: "72px",
    fontWeight: "bold",
    lineHeight: 1.2,
  },
  coverSubTitle: {
    fontSize: "34px",
    fontWeight: "bold",
    marginTop: "12px",
  },
  coverBadge: {
    alignSelf: "flex-start",
    background: "rgba(255,255,255,0.16)",
    border: "1px solid rgba(255,255,255,0.28)",
    borderRadius: "999px",
    padding: "12px 24px",
    fontSize: "20px",
    fontWeight: "bold",
  },
  coverFooter: {
    fontSize: "20px",
    opacity: 0.9,
  },
  tocWrap: {
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.22)",
    borderRadius: "20px",
    padding: "20px 24px",
    display: "grid",
    gap: "10px",
  },
  tocItem: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "20px",
    borderBottom: "1px dashed rgba(255,255,255,0.25)",
    paddingBottom: "8px",
  },
  yearMonthPage: {
    width: "794px",
    minHeight: "1123px",
    background: "#ffffff",
    color: "#111827",
    padding: "28px",
    boxSizing: "border-box",
    fontFamily: "'Microsoft JhengHei', Arial, sans-serif",
  },
  yearMonthHeader: {
    textAlign: "center",
    marginBottom: "16px",
  },
  yearMonthTitle: {
    fontSize: "34px",
    fontWeight: "bold",
    color: "#991b1b",
  },
  yearMonthSubTitle: {
    fontSize: "18px",
    color: "#6b7280",
    marginTop: "8px",
  },
  yearWeekHeader: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "10px",
    marginBottom: "10px",
  },
  yearWeekCell: {
    textAlign: "center",
    fontSize: "18px",
    fontWeight: "bold",
    color: "#374151",
    padding: "6px 0",
  },
  yearMonthGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "10px",
    gridAutoRows: "150px",
  },
  yearEmptyCell: {
    background: "transparent",
    borderRadius: "18px",
  },
  yearDayCard: {
    border: "2px solid #e5e7eb",
    borderRadius: "18px",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    overflow: "hidden",
    boxSizing: "border-box",
  },
  yearDayTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "6px",
  },
  yearDayNumber: {
    fontSize: "24px",
    fontWeight: "bold",
  },
  yearDayBadge: {
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: "bold",
  },
  yearDayWeek: {
    fontSize: "14px",
    marginBottom: "4px",
  },
  yearDayLunar: {
    fontSize: "15px",
    fontWeight: "bold",
    marginBottom: "4px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  yearDayHoliday: {
    fontSize: "13px",
    fontWeight: "bold",
    color: "#dc2626",
    marginBottom: "2px",
  },
  yearDaySolarTerm: {
    fontSize: "13px",
    fontWeight: "bold",
    color: "#2563eb",
    marginBottom: "2px",
  },
  yearDayText: {
    fontSize: "14px",
    color: "#4b5563",
    lineHeight: 1.35,
  },
};
