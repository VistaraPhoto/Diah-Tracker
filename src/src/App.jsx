import { useState, useEffect } from "react";

const STORAGE_KEY = "ayu_period_tracker_v1";

const MOODS = [
  { id: "happy", emoji: "🌸", label: "Senang" },
  { id: "sad", emoji: "🥺", label: "Sedih" },
  { id: "anxious", emoji: "😟", label: "Cemas" },
  { id: "tired", emoji: "😴", label: "Lelah" },
  { id: "romantic", emoji: "🥰", label: "Romantis" },
  { id: "angry", emoji: "😤", label: "Emosi" },
  { id: "calm", emoji: "☁️", label: "Tenang" },
  { id: "energetic", emoji: "✨", label: "Semangat" },
];

const SYMPTOMS = [
  { id: "cramps", emoji: "🌀", label: "Kram" },
  { id: "headache", emoji: "💫", label: "Sakit Kepala" },
  { id: "bloating", emoji: "🫧", label: "Perut Kembung" },
  { id: "backpain", emoji: "🔅", label: "Sakit Pinggang" },
  { id: "nausea", emoji: "🌿", label: "Mual" },
  { id: "tender", emoji: "🌷", label: "Payudara Nyeri" },
  { id: "acne", emoji: "🌺", label: "Jerawat" },
  { id: "fatigue", emoji: "🍃", label: "Lelah Banget" },
];

const FLOW = [
  { id: "light", label: "Ringan", dots: 1 },
  { id: "medium", label: "Sedang", dots: 2 },
  { id: "heavy", label: "Deras", dots: 3 },
];

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { periods: [], logs: {}, cycleLength: 28 };
  } catch {
    return { periods: [], logs: {}, cycleLength: 28 };
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

function toDateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function predictNextPeriods(periods, cycleLength) {
  if (periods.length === 0) return [];
  const sorted = [...periods].sort((a, b) => new Date(a) - new Date(b));
  const lastStart = new Date(sorted[sorted.length - 1]);
  const predictions = [];
  for (let i = 1; i <= 3; i++) {
    const next = new Date(lastStart);
    next.setDate(next.getDate() + cycleLength * i);
    predictions.push(next);
  }
  return predictions;
}

function getPeriodDates(periods) {
  const set = new Set();
  periods.forEach((p) => {
    for (let i = 0; i < 5; i++) {
      const d = new Date(p);
      d.setDate(d.getDate() + i);
      set.add(d.toISOString().split("T")[0]);
    }
  });
  return set;
}

function getOvulationDates(periods, cycleLength) {
  const set = new Set();
  periods.forEach((p) => {
    const d = new Date(p);
    d.setDate(d.getDate() + Math.floor(cycleLength / 2));
    set.add(d.toISOString().split("T")[0]);
  });
  return set;
}

function getFertileDates(periods, cycleLength) {
  const set = new Set();
  periods.forEach((p) => {
    const ovDay = Math.floor(cycleLength / 2);
    for (let i = ovDay - 3; i <= ovDay + 1; i++) {
      const d = new Date(p);
      d.setDate(d.getDate() + i);
      set.add(d.toISOString().split("T")[0]);
    }
  });
  return set;
}

export default function App() {
  const [data, setData] = useState(loadData);
  const [tab, setTab] = useState("home");
  const [today] = useState(new Date());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState(null);
  const [logModal, setLogModal] = useState(false);
  const [logDate, setLogDate] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    saveData(data);
  }, [data]);

  const showNotif = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2500);
  };

  const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate());
  const periodDates = getPeriodDates(data.periods);
  const ovulationDates = getOvulationDates(data.periods, data.cycleLength);
  const fertileDates = getFertileDates(data.periods, data.cycleLength);
  const predictions = predictNextPeriods(data.periods, data.cycleLength);
  const predictionDates = getPeriodDates(predictions.map((d) => d.toISOString()));

  const sorted = [...data.periods].sort((a, b) => new Date(b) - new Date(a));
  const lastPeriodDate = sorted[0] ? new Date(sorted[0]) : null;
  const nextPeriodDate = predictions[0];

  const daysUntilNext = nextPeriodDate
    ? Math.ceil((nextPeriodDate - today) / (1000 * 60 * 60 * 24))
    : null;

  const isOnPeriod = periodDates.has(todayKey);
  const dayOfCycle = lastPeriodDate
    ? Math.floor((today - lastPeriodDate) / (1000 * 60 * 60 * 24)) + 1
    : null;

  const togglePeriodStart = (dateKey) => {
    const exists = data.periods.includes(dateKey);
    const newPeriods = exists
      ? data.periods.filter((p) => p !== dateKey)
      : [...data.periods, dateKey];
    setData((d) => ({ ...d, periods: newPeriods }));
    showNotif(exists ? "Tanggal haid dihapus 🌿" : "Tanggal haid ditandai 🌸");
  };

  const openLog = (dateKey) => {
    setLogDate(dateKey);
    setLogModal(true);
  };

  const updateLog = (field, value) => {
    setData((d) => ({
      ...d,
      logs: {
        ...d.logs,
        [logDate]: {
          ...(d.logs[logDate] || {}),
          [field]: value,
        },
      },
    }));
  };

  const toggleArrayLog = (field, value) => {
    const cur = (data.logs[logDate] || {})[field] || [];
    const updated = cur.includes(value) ? cur.filter((x) => x !== value) : [...cur, value];
    updateLog(field, updated);
  };

  const currentLog = logDate ? data.logs[logDate] || {} : {};

  const MONTH_NAMES = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];

  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfMonth(calYear, calMonth);

  const getDayStatus = (dateKey) => {
    if (periodDates.has(dateKey)) return "period";
    if (predictionDates.has(dateKey)) return "predicted";
    if (ovulationDates.has(dateKey)) return "ovulation";
    if (fertileDates.has(dateKey)) return "fertile";
    return null;
  };

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  };

  const styles = {
    app: {
      minHeight: "100vh",
      background: "linear-gradient(160deg, #fff0f5 0%, #fce4ec 40%, #f8bbd0 100%)",
      fontFamily: "'Nunito', sans-serif",
      position: "relative",
      maxWidth: 430,
      margin: "0 auto",
      paddingBottom: 80,
    },
    header: {
      background: "linear-gradient(135deg, #f48fb1 0%, #e91e8c 100%)",
      padding: "20px 20px 16px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      boxShadow: "0 4px 20px rgba(233,30,140,0.25)",
    },
    headerTitle: {
      color: "#fff",
      fontSize: 20,
      fontWeight: 800,
      letterSpacing: 0.5,
    },
    headerSub: {
      color: "rgba(255,255,255,0.85)",
      fontSize: 12,
      marginTop: 2,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: "50%",
      background: "rgba(255,255,255,0.25)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 20,
      cursor: "pointer",
      border: "2px solid rgba(255,255,255,0.5)",
    },
    nav: {
      position: "fixed",
      bottom: 0,
      left: "50%",
      transform: "translateX(-50%)",
      width: "100%",
      maxWidth: 430,
      background: "#fff",
      borderTop: "1px solid #fce4ec",
      display: "flex",
      zIndex: 100,
      boxShadow: "0 -4px 20px rgba(244,143,177,0.15)",
    },
    navBtn: (active) => ({
      flex: 1,
      padding: "10px 0 8px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 2,
      background: "none",
      border: "none",
      cursor: "pointer",
      color: active ? "#e91e8c" : "#bbb",
      fontSize: 10,
      fontWeight: active ? 700 : 500,
      fontFamily: "'Nunito', sans-serif",
      transition: "color 0.2s",
    }),
    navIcon: { fontSize: 22 },
    card: {
      background: "#fff",
      borderRadius: 20,
      padding: "18px 20px",
      margin: "12px 16px",
      boxShadow: "0 4px 20px rgba(244,143,177,0.15)",
    },
    cardTitle: {
      fontSize: 13,
      color: "#e91e8c",
      fontWeight: 700,
      marginBottom: 8,
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },
    statusBig: {
      textAlign: "center",
      padding: "24px 20px 20px",
    },
    statusCircle: (color) => ({
      width: 130,
      height: 130,
      borderRadius: "50%",
      background: color,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      margin: "0 auto 16px",
      boxShadow: `0 8px 30px ${color}88`,
      position: "relative",
    }),
    statusEmoji: { fontSize: 36 },
    statusNum: {
      fontSize: 28,
      fontWeight: 900,
      color: "#fff",
      lineHeight: 1,
    },
    statusLabel: {
      fontSize: 11,
      color: "rgba(255,255,255,0.9)",
      fontWeight: 600,
    },
    statusText: {
      fontSize: 16,
      fontWeight: 800,
      color: "#c2185b",
    },
    statusSub: {
      fontSize: 13,
      color: "#f48fb1",
      marginTop: 4,
    },
    calGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(7, 1fr)",
      gap: 4,
    },
    calDay: (status, isToday, isEmpty) => ({
      aspectRatio: "1",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 13,
      fontWeight: isToday ? 800 : 500,
      cursor: isEmpty ? "default" : "pointer",
      background:
        status === "period" ? "linear-gradient(135deg, #f06292, #e91e8c)" :
        status === "predicted" ? "linear-gradient(135deg, #f8bbd0, #f48fb1)" :
        status === "ovulation" ? "linear-gradient(135deg, #a5d6a7, #66bb6a)" :
        status === "fertile" ? "linear-gradient(135deg, #c8e6c9, #a5d6a7)" :
        isToday ? "linear-gradient(135deg, #fce4ec, #f48fb1)" : "transparent",
      color:
        status === "period" ? "#fff" :
        status === "predicted" ? "#c2185b" :
        status === "ovulation" ? "#fff" :
        status === "fertile" ? "#388e3c" :
        isToday ? "#e91e8c" : "#555",
      border: isToday && !status ? "2px solid #f48fb1" : "2px solid transparent",
      transition: "transform 0.15s",
      position: "relative",
    }),
    logDot: {
      position: "absolute",
      bottom: 2,
      right: 2,
      width: 5,
      height: 5,
      borderRadius: "50%",
      background: "#e91e8c",
    },
    legend: {
      display: "flex",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 12,
    },
    legendItem: (color) => ({
      display: "flex",
      alignItems: "center",
      gap: 5,
      fontSize: 11,
      color: "#888",
    }),
    legendDot: (color) => ({
      width: 10,
      height: 10,
      borderRadius: "50%",
      background: color,
    }),
    chips: {
      display: "flex",
      flexWrap: "wrap",
      gap: 8,
    },
    chip: (active) => ({
      padding: "7px 14px",
      borderRadius: 20,
      border: `1.5px solid ${active ? "#e91e8c" : "#fce4ec"}`,
      background: active ? "linear-gradient(135deg, #fce4ec, #f8bbd0)" : "#fff",
      color: active ? "#c2185b" : "#aaa",
      fontSize: 13,
      fontWeight: active ? 700 : 500,
      cursor: "pointer",
      transition: "all 0.15s",
    }),
    modal: {
      position: "fixed",
      inset: 0,
      background: "rgba(194,24,91,0.15)",
      backdropFilter: "blur(6px)",
      zIndex: 200,
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "center",
    },
    modalBox: {
      background: "#fff",
      borderRadius: "24px 24px 0 0",
      padding: "24px 20px 40px",
      width: "100%",
      maxWidth: 430,
      maxHeight: "85vh",
      overflowY: "auto",
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 800,
      color: "#c2185b",
      marginBottom: 4,
    },
    modalSub: {
      fontSize: 13,
      color: "#f48fb1",
      marginBottom: 20,
    },
    sectionLabel: {
      fontSize: 13,
      fontWeight: 700,
      color: "#e91e8c",
      marginBottom: 8,
      marginTop: 16,
    },
    btn: (variant) => ({
      padding: "12px 28px",
      borderRadius: 16,
      border: "none",
      fontFamily: "'Nunito', sans-serif",
      fontWeight: 800,
      fontSize: 15,
      cursor: "pointer",
      background:
        variant === "primary" ? "linear-gradient(135deg, #f06292, #e91e8c)" :
        variant === "danger" ? "linear-gradient(135deg, #ef9a9a, #e57373)" : "#fce4ec",
      color: variant === "ghost" ? "#e91e8c" : "#fff",
      transition: "opacity 0.15s",
    }),
    notif: {
      position: "fixed",
      top: 80,
      left: "50%",
      transform: "translateX(-50%)",
      background: "linear-gradient(135deg, #f06292, #e91e8c)",
      color: "#fff",
      padding: "10px 24px",
      borderRadius: 20,
      fontWeight: 700,
      fontSize: 14,
      zIndex: 300,
      boxShadow: "0 4px 20px rgba(233,30,140,0.3)",
      pointerEvents: "none",
      whiteSpace: "nowrap",
    },
    insightRow: {
      display: "flex",
      gap: 8,
    },
    insightCard: (color) => ({
      flex: 1,
      background: color,
      borderRadius: 16,
      padding: "14px 12px",
      textAlign: "center",
    }),
    insightNum: {
      fontSize: 22,
      fontWeight: 900,
      color: "#c2185b",
    },
    insightLabel: {
      fontSize: 11,
      color: "#e91e8c",
      fontWeight: 600,
      marginTop: 2,
    },
    todayLogBtn: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "12px 16px",
      background: "linear-gradient(135deg, #fce4ec, #f8bbd0)",
      borderRadius: 16,
      cursor: "pointer",
      border: "none",
      width: "100%",
      fontFamily: "'Nunito', sans-serif",
      marginTop: 8,
    },
  };

  // Phase text
  let phaseText = "Hari biasa";
  let phaseEmoji = "🌙";
  let phaseColor = "linear-gradient(135deg, #f48fb1, #e91e8c)";
  if (isOnPeriod) { phaseText = "Lagi haid"; phaseEmoji = "🌸"; phaseColor = "linear-gradient(135deg, #f06292, #e91e8c)"; }
  else if (dayOfCycle) {
    const d = dayOfCycle;
    const half = data.cycleLength / 2;
    if (d >= half - 3 && d <= half + 1) { phaseText = "Masa subur"; phaseEmoji = "🌿"; phaseColor = "linear-gradient(135deg, #a5d6a7, #43a047)"; }
    else if (daysUntilNext && daysUntilNext <= 5) { phaseText = "Hampir haid"; phaseEmoji = "🌺"; phaseColor = "linear-gradient(135deg, #f8bbd0, #f06292)"; }
    else if (d < 7) { phaseText = "Pasca haid"; phaseEmoji = "✨"; phaseColor = "linear-gradient(135deg, #fce4ec, #f48fb1)"; }
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <div style={styles.app}>
        {/* HEADER */}
        <div style={styles.header}>
          <div>
            <div style={styles.headerTitle}>🌸 Halo, Ayu!</div>
            <div style={styles.headerSub}>Tracker haid cantikmu 💕</div>
          </div>
          <div style={styles.avatar} onClick={() => setSettingsOpen(true)}>⚙️</div>
        </div>

        {/* NOTIFICATION */}
        {notification && <div style={styles.notif}>{notification}</div>}

        {/* ===== HOME TAB ===== */}
        {tab === "home" && (
          <>
            {/* Status Circle */}
            <div style={{ ...styles.card, ...styles.statusBig }}>
              <div style={styles.statusCircle(phaseColor)}>
                <div style={styles.statusEmoji}>{phaseEmoji}</div>
                {dayOfCycle && (
                  <>
                    <div style={styles.statusNum}>{dayOfCycle}</div>
                    <div style={styles.statusLabel}>Hari ke</div>
                  </>
                )}
              </div>
              <div style={styles.statusText}>{phaseText}</div>
              <div style={styles.statusSub}>
                {daysUntilNext != null
                  ? daysUntilNext > 0
                    ? `Haid berikutnya dalam ${daysUntilNext} hari`
                    : "Waktunya haid nih! 🌸"
                  : lastPeriodDate
                  ? "Tandai tanggal haid pertamamu"
                  : "Tandai tanggal haid pertamamu di Kalender 📅"}
              </div>
              <button style={{ ...styles.btn("ghost"), marginTop: 14, width: "100%", background: "#fce4ec" }}
                onClick={() => openLog(todayKey)}>
                📝 Catat hari ini
              </button>
            </div>

            {/* Quick Stats */}
            <div style={styles.card}>
              <div style={styles.cardTitle}>Ringkasan Siklus</div>
              <div style={styles.insightRow}>
                <div style={styles.insightCard("#fce4ec")}>
                  <div style={styles.insightNum}>{data.cycleLength}</div>
                  <div style={styles.insightLabel}>Panjang Siklus</div>
                </div>
                <div style={styles.insightCard("#fce4ec")}>
                  <div style={styles.insightNum}>{data.periods.length}</div>
                  <div style={styles.insightLabel}>Total Haid</div>
                </div>
                <div style={styles.insightCard("#fce4ec")}>
                  <div style={styles.insightNum}>{daysUntilNext != null ? (daysUntilNext > 0 ? daysUntilNext : 0) : "-"}</div>
                  <div style={styles.insightLabel}>Hari Lagi</div>
                </div>
              </div>
            </div>

            {/* Today's Log Preview */}
            <div style={styles.card}>
              <div style={styles.cardTitle}>Catatan Hari Ini</div>
              {data.logs[todayKey] ? (
                <div>
                  {data.logs[todayKey].mood && (
                    <div style={{ marginBottom: 8, fontSize: 14, color: "#888" }}>
                      Mood: {MOODS.find(m => m.id === data.logs[todayKey].mood)?.emoji} {MOODS.find(m => m.id === data.logs[todayKey].mood)?.label}
                    </div>
                  )}
                  {data.logs[todayKey].symptoms?.length > 0 && (
                    <div style={{ fontSize: 14, color: "#888" }}>
                      Gejala: {data.logs[todayKey].symptoms.map(s => SYMPTOMS.find(x => x.id === s)?.emoji).join(" ")}
                    </div>
                  )}
                  {data.logs[todayKey].note && (
                    <div style={{ fontSize: 13, color: "#aaa", marginTop: 6, fontStyle: "italic" }}>
                      "{data.logs[todayKey].note}"
                    </div>
                  )}
                  <button onClick={() => openLog(todayKey)} style={{ ...styles.btn("ghost"), marginTop: 10, padding: "8px 16px", fontSize: 13, background: "#fce4ec" }}>
                    Edit Catatan ✏️
                  </button>
                </div>
              ) : (
                <button style={styles.todayLogBtn} onClick={() => openLog(todayKey)}>
                  <span style={{ fontSize: 14, color: "#c2185b", fontWeight: 600 }}>Belum ada catatan hari ini</span>
                  <span style={{ fontSize: 20 }}>✍️</span>
                </button>
              )}
            </div>
          </>
        )}

        {/* ===== CALENDAR TAB ===== */}
        {tab === "calendar" && (
          <div style={styles.card}>
            {/* Month nav */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <button onClick={prevMonth} style={{ background: "#fce4ec", border: "none", borderRadius: 10, padding: "6px 12px", fontSize: 18, cursor: "pointer" }}>‹</button>
              <div style={{ fontWeight: 800, fontSize: 16, color: "#c2185b" }}>
                {MONTH_NAMES[calMonth]} {calYear}
              </div>
              <button onClick={nextMonth} style={{ background: "#fce4ec", border: "none", borderRadius: 10, padding: "6px 12px", fontSize: 18, cursor: "pointer" }}>›</button>
            </div>

            {/* Day labels */}
            <div style={styles.calGrid}>
              {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map(d => (
                <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "#f48fb1", padding: "4px 0" }}>{d}</div>
              ))}
              {Array(firstDay).fill(null).map((_, i) => <div key={`e${i}`} />)}
              {Array(daysInMonth).fill(null).map((_, i) => {
                const day = i + 1;
                const dateKey = toDateKey(calYear, calMonth, day);
                const status = getDayStatus(dateKey);
                const isToday = dateKey === todayKey;
                const hasLog = !!data.logs[dateKey];
                return (
                  <div key={day} style={{ position: "relative" }}>
                    <div
                      style={styles.calDay(status, isToday, false)}
                      onClick={() => {
                        setSelectedDay(dateKey);
                        openLog(dateKey);
                      }}
                    >
                      {day}
                    </div>
                    {hasLog && <div style={styles.logDot} />}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div style={styles.legend}>
              {[
                { color: "#e91e8c", label: "Haid" },
                { color: "#f48fb1", label: "Prediksi" },
                { color: "#66bb6a", label: "Ovulasi" },
                { color: "#a5d6a7", label: "Masa Subur" },
              ].map(l => (
                <div key={l.label} style={styles.legendItem(l.color)}>
                  <div style={styles.legendDot(l.color)} />
                  {l.label}
                </div>
              ))}
            </div>

            {/* Quick mark period button */}
            <button
              style={{ ...styles.btn("primary"), width: "100%", marginTop: 16 }}
              onClick={() => {
                const today2 = toDateKey(today.getFullYear(), today.getMonth(), today.getDate());
                togglePeriodStart(today2);
              }}
            >
              {periodDates.has(todayKey) ? "❌ Hapus Haid Hari Ini" : "🌸 Tandai Haid Hari Ini"}
            </button>

            {/* Upcoming */}
            {predictions.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={styles.cardTitle}>Prediksi Berikutnya</div>
                {predictions.map((d, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #fce4ec", fontSize: 14, color: "#888" }}>
                    <span>Siklus {i + 1}</span>
                    <span style={{ fontWeight: 700, color: "#e91e8c" }}>
                      {d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== LOG TAB ===== */}
        {tab === "log" && (
          <>
            <div style={styles.card}>
              <div style={styles.cardTitle}>Riwayat Catatan</div>
              {Object.keys(data.logs).length === 0 ? (
                <div style={{ textAlign: "center", color: "#f48fb1", padding: "20px 0" }}>
                  <div style={{ fontSize: 36 }}>🌸</div>
                  <div style={{ marginTop: 8, fontSize: 14 }}>Belum ada catatan. Mulai catat dari tab Beranda ya!</div>
                </div>
              ) : (
                Object.entries(data.logs)
                  .sort((a, b) => new Date(b[0]) - new Date(a[0]))
                  .map(([date, log]) => (
                    <div key={date} onClick={() => openLog(date)}
                      style={{ padding: "12px 0", borderBottom: "1px solid #fce4ec", cursor: "pointer" }}>
                      <div style={{ fontWeight: 700, color: "#c2185b", fontSize: 14 }}>
                        {new Date(date + "T00:00:00").toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}
                      </div>
                      <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                        {log.mood && <span style={{ background: "#fce4ec", borderRadius: 10, padding: "2px 8px", fontSize: 12, color: "#e91e8c" }}>
                          {MOODS.find(m => m.id === log.mood)?.emoji} {MOODS.find(m => m.id === log.mood)?.label}
                        </span>}
                        {log.symptoms?.map(s => (
                          <span key={s} style={{ background: "#fce4ec", borderRadius: 10, padding: "2px 8px", fontSize: 12, color: "#e91e8c" }}>
                            {SYMPTOMS.find(x => x.id === s)?.emoji}
                          </span>
                        ))}
                        {log.flow && <span style={{ background: "#fce4ec", borderRadius: 10, padding: "2px 8px", fontSize: 12, color: "#e91e8c" }}>
                          💧 {FLOW.find(f => f.id === log.flow)?.label}
                        </span>}
                      </div>
                      {log.note && <div style={{ fontSize: 12, color: "#aaa", marginTop: 4, fontStyle: "italic" }}>"{log.note}"</div>}
                    </div>
                  ))
              )}
            </div>
          </>
        )}

        {/* BOTTOM NAV */}
        <nav style={styles.nav}>
          {[
            { id: "home", emoji: "🏠", label: "Beranda" },
            { id: "calendar", emoji: "📅", label: "Kalender" },
            { id: "log", emoji: "📝", label: "Catatan" },
          ].map(t => (
            <button key={t.id} style={styles.navBtn(tab === t.id)} onClick={() => setTab(t.id)}>
              <span style={styles.navIcon}>{t.emoji}</span>
              {t.label}
            </button>
          ))}
        </nav>

        {/* LOG MODAL */}
        {logModal && logDate && (
          <div style={styles.modal} onClick={() => setLogModal(false)}>
            <div style={styles.modalBox} onClick={e => e.stopPropagation()}>
              <div style={styles.modalTitle}>Catatan 📝</div>
              <div style={styles.modalSub}>
                {new Date(logDate + "T00:00:00").toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </div>

              {/* Mark period */}
              <div style={styles.sectionLabel}>🌸 Tandai Haid</div>
              <button
                style={{ ...styles.btn(data.periods.includes(logDate) ? "danger" : "primary"), width: "100%" }}
                onClick={() => togglePeriodStart(logDate)}
              >
                {data.periods.includes(logDate) ? "❌ Hapus Tanda Haid" : "🌸 Ini Hari Pertama Haid"}
              </button>

              {/* Flow */}
              {(data.periods.includes(logDate) || periodDates.has(logDate)) && (
                <>
                  <div style={styles.sectionLabel}>💧 Aliran Darah</div>
                  <div style={styles.chips}>
                    {FLOW.map(f => (
                      <button key={f.id} style={styles.chip(currentLog.flow === f.id)}
                        onClick={() => updateLog("flow", currentLog.flow === f.id ? null : f.id)}>
                        {"●".repeat(f.dots)} {f.label}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Mood */}
              <div style={styles.sectionLabel}>💕 Mood Kamu</div>
              <div style={styles.chips}>
                {MOODS.map(m => (
                  <button key={m.id} style={styles.chip(currentLog.mood === m.id)}
                    onClick={() => updateLog("mood", currentLog.mood === m.id ? null : m.id)}>
                    {m.emoji} {m.label}
                  </button>
                ))}
              </div>

              {/* Symptoms */}
              <div style={styles.sectionLabel}>🌿 Gejala</div>
              <div style={styles.chips}>
                {SYMPTOMS.map(s => (
                  <button key={s.id} style={styles.chip((currentLog.symptoms || []).includes(s.id))}
                    onClick={() => toggleArrayLog("symptoms", s.id)}>
                    {s.emoji} {s.label}
                  </button>
                ))}
              </div>

              {/* Note */}
              <div style={styles.sectionLabel}>✍️ Catatan Kecil</div>
              <textarea
                value={currentLog.note || ""}
                onChange={e => updateLog("note", e.target.value)}
                placeholder="Mau tulis apa hari ini, Ayu? 💕"
                style={{
                  width: "100%", padding: "12px 14px", borderRadius: 14,
                  border: "1.5px solid #fce4ec", fontFamily: "'Nunito', sans-serif",
                  fontSize: 14, color: "#555", resize: "none", height: 80,
                  outline: "none", boxSizing: "border-box",
                }}
              />

              <button style={{ ...styles.btn("primary"), width: "100%", marginTop: 16 }}
                onClick={() => { setLogModal(false); showNotif("Catatan disimpan! 💕"); }}>
                Simpan 💾
              </button>
            </div>
          </div>
        )}

        {/* SETTINGS MODAL */}
        {settingsOpen && (
          <div style={styles.modal} onClick={() => setSettingsOpen(false)}>
            <div style={styles.modalBox} onClick={e => e.stopPropagation()}>
              <div style={styles.modalTitle}>⚙️ Pengaturan</div>
              <div style={styles.modalSub}>Sesuaikan tracker kamu, Ayu 💕</div>

              <div style={styles.sectionLabel}>📅 Panjang Siklus (hari)</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button onClick={() => setData(d => ({ ...d, cycleLength: Math.max(21, d.cycleLength - 1) }))}
                  style={{ ...styles.btn("ghost"), padding: "8px 16px", background: "#fce4ec" }}>−</button>
                <span style={{ fontSize: 24, fontWeight: 900, color: "#e91e8c", flex: 1, textAlign: "center" }}>
                  {data.cycleLength}
                </span>
                <button onClick={() => setData(d => ({ ...d, cycleLength: Math.min(40, d.cycleLength + 1) }))}
                  style={{ ...styles.btn("ghost"), padding: "8px 16px", background: "#fce4ec" }}>+</button>
              </div>

              <div style={styles.sectionLabel}>🗑️ Hapus Data</div>
              <button style={{ ...styles.btn("danger"), width: "100%" }}
                onClick={() => {
                  if (confirm("Yakin mau hapus semua data? 🥺")) {
                    setData({ periods: [], logs: {}, cycleLength: 28 });
                    setSettingsOpen(false);
                    showNotif("Data dihapus 🌿");
                  }
                }}>
                Hapus Semua Data
              </button>

              <button style={{ ...styles.btn("ghost"), width: "100%", marginTop: 10, background: "#fce4ec" }}
                onClick={() => setSettingsOpen(false)}>
                Tutup
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
