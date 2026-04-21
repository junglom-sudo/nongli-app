export default function Day1EnglishSpeakingApp() {
  const { useState } = React;

  const [screen, setScreen] = useState("home");
  const [score, setScore] = useState(82);
  const [userName, setUserName] = useState("Leo");
  const [selectedSpeed, setSelectedSpeed] = useState("slow");
  const [isRecording, setIsRecording] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const [transcript, setTranscript] = useState("Hello");

  const progressMap = {
    home: 0,
    intro: 10,
    listen: 25,
    breakdown: 45,
    replace: 60,
    dialogue: 80,
    feedback: 90,
    done: 100,
  };

  const ProgressBar = () => (
    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
      <div
        className="h-full bg-emerald-500 transition-all duration-500"
        style={{ width: `${progressMap[screen] || 0}%` }}
      />
    </div>
  );

  const PrimaryButton = ({ children, onClick, className = "" }) => (
    <button
      onClick={onClick}
      className={`w-full rounded-2xl bg-emerald-500 text-white font-semibold py-4 px-5 shadow-sm hover:bg-emerald-600 transition ${className}`}
    >
      {children}
    </button>
  );

  const SecondaryButton = ({ children, onClick, className = "" }) => (
    <button
      onClick={onClick}
      className={`w-full rounded-2xl bg-white text-slate-700 font-medium py-4 px-5 border border-slate-200 hover:bg-slate-50 transition ${className}`}
    >
      {children}
    </button>
  );

  const Card = ({ children, className = "" }) => (
    <div className={`bg-white rounded-3xl shadow-sm border border-slate-100 ${className}`}>
      {children}
    </div>
  );

  const AppFrame = ({ children, showProgress = true }) => (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-50 rounded-[32px] shadow-2xl border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-sky-500 to-cyan-400 px-6 pt-6 pb-5 text-white">
          <div className="text-sm opacity-90">SpeakUp English</div>
          <div className="text-2xl font-bold mt-1">Day 1｜開口第一句</div>
          <div className="text-sm mt-1 opacity-90">從 0 開始，也能先開口。</div>
        </div>
        <div className="p-5 space-y-4">
          {showProgress && <ProgressBar />}
          {children}
        </div>
      </div>
    </div>
  );

  const BottomTabs = () => (
    <div className="grid grid-cols-4 gap-2 pt-2 text-xs text-slate-500">
      {[
        ["首頁", "🏠"],
        ["練習", "🎯"],
        ["紀錄", "📈"],
        ["我的", "👤"],
      ].map(([label, icon], idx) => (
        <div
          key={idx}
          className={`rounded-2xl py-2 text-center ${idx === 0 ? "bg-sky-100 text-sky-700 font-semibold" : "bg-white border border-slate-200"}`}
        >
          <div>{icon}</div>
          <div>{label}</div>
        </div>
      ))}
    </div>
  );

  if (screen === "home") {
    return (
      <AppFrame showProgress={false}>
        <Card className="p-5 bg-gradient-to-r from-sky-500 to-cyan-400 text-white border-0">
          <div className="text-lg font-semibold">早安，開始你的第一句英文吧 👋</div>
          <div className="text-sm opacity-90 mt-1">今天只需要 3 分鐘</div>
        </Card>

        <Card className="p-5 space-y-4">
          <div className="text-sm text-slate-500">今日任務</div>
          <div className="text-2xl font-bold text-slate-800">Day 1｜開口第一句</div>
          <div className="text-slate-600">目標：說出 Hello 和 I am ___</div>
          <div>
            <div className="flex justify-between text-sm text-slate-500 mb-2">
              <span>進度</span>
              <span>0%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div className="w-0 h-full bg-emerald-500 rounded-full" />
            </div>
          </div>
          <PrimaryButton onClick={() => setScreen("intro")}>開始今天練習</PrimaryButton>
        </Card>

        <Card className="p-4">
          <div className="text-sm font-semibold text-slate-700 mb-3">本週學習地圖</div>
          <div className="grid grid-cols-4 gap-2 text-sm">
            <div className="rounded-2xl bg-emerald-100 text-emerald-700 py-3 text-center font-semibold">Day 1 ▶</div>
            <div className="rounded-2xl bg-white border border-slate-200 py-3 text-center">Day 2</div>
            <div className="rounded-2xl bg-white border border-slate-200 py-3 text-center">Day 3</div>
            <div className="rounded-2xl bg-white border border-slate-200 py-3 text-center">Day 4</div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm font-semibold text-slate-700">你今天會學會</div>
          <div className="mt-2 flex gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-sky-100 text-sky-700 text-sm">Hello</span>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm">I am ___</span>
          </div>
        </Card>

        <BottomTabs />
      </AppFrame>
    );
  }

  if (screen === "intro") {
    return (
      <AppFrame>
        <Card className="p-5 space-y-4">
          <div>
            <div className="text-sm text-slate-500">今天你會學會</div>
            <div className="mt-3 space-y-2">
              <div className="rounded-2xl bg-sky-50 px-4 py-3 text-slate-800 font-medium">✔ Hello</div>
              <div className="rounded-2xl bg-sky-50 px-4 py-3 text-slate-800 font-medium">✔ I am ___</div>
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-500">練習流程</div>
            <div className="mt-3 space-y-2 text-slate-700">
              <div>1. 聽一遍</div>
              <div>2. 跟著說</div>
              <div>3. 說出你的名字</div>
              <div>4. 和 AI 做小對話</div>
            </div>
          </div>
        </Card>
        <PrimaryButton onClick={() => setScreen("listen")}>開始</PrimaryButton>
        <SecondaryButton onClick={() => setScreen("home")}>返回首頁</SecondaryButton>
      </AppFrame>
    );
  }

  if (screen === "listen") {
    return (
      <AppFrame>
        <Card className="p-6 text-center space-y-4">
          <div className="text-sm text-slate-500">步驟 1 / 4</div>
          <div className="text-4xl font-bold text-slate-800">Hello</div>
          <div className="text-slate-500">中文：你好</div>
          <div className="text-7xl">👋</div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setSelectedSpeed("normal")}
              className={`rounded-2xl py-3 border ${selectedSpeed === "normal" ? "bg-sky-100 border-sky-300 text-sky-700" : "bg-white border-slate-200 text-slate-700"}`}
            >
              🔊 正常速度
            </button>
            <button
              onClick={() => setSelectedSpeed("slow")}
              className={`rounded-2xl py-3 border ${selectedSpeed === "slow" ? "bg-emerald-100 border-emerald-300 text-emerald-700" : "bg-white border-slate-200 text-slate-700"}`}
            >
              🐢 慢速播放
            </button>
          </div>
          <div className="text-sm text-slate-500">先聽，再跟著說。</div>
        </Card>
        <PrimaryButton onClick={() => setScreen("breakdown")}>我聽好了，開始跟讀</PrimaryButton>
      </AppFrame>
    );
  }

  if (screen === "breakdown") {
    return (
      <AppFrame>
        <Card className="p-6 space-y-5 text-center">
          <div className="text-sm text-slate-500">步驟 2 / 4</div>
          <div className="text-3xl font-bold text-slate-800">一起拆開說</div>
          <div className="flex justify-center gap-3 flex-wrap">
            {["I", "am", "Tom"].map((word) => (
              <button key={word} className="px-5 py-3 rounded-2xl bg-white border border-slate-200 shadow-sm text-lg font-semibold text-slate-800">
                {word}
              </button>
            ))}
          </div>
          <div className="space-y-2 text-slate-600">
            <div>先說：<span className="font-semibold">I am</span></div>
            <div>再說：<span className="font-semibold">I am Tom</span></div>
          </div>
          <div className="bg-amber-50 rounded-2xl p-4 text-amber-800 text-sm">每個字都可以點來聽，慢慢來就好。</div>
        </Card>
        <PrimaryButton onClick={() => setScreen("replace")}>下一步</PrimaryButton>
      </AppFrame>
    );
  }

  if (screen === "replace") {
    return (
      <AppFrame>
        <Card className="p-6 space-y-5 text-center">
          <div className="text-sm text-slate-500">步驟 3 / 4</div>
          <div className="text-3xl font-bold text-slate-800">換成你的答案</div>
          <div className="text-4xl font-bold text-emerald-600">I am ___</div>
          <div className="text-slate-600">請把空格換成你的名字</div>
          <div className="rounded-2xl bg-sky-50 p-4 text-slate-700">
            你的名字
            <input
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-sky-200 bg-white px-4 py-3 outline-none"
            />
          </div>
          <div className="text-sm text-slate-500">你可以說：I am {userName || "Leo"}</div>
        </Card>
        <div className="grid grid-cols-2 gap-3">
          <SecondaryButton onClick={() => setScreen("listen")}>再聽範例</SecondaryButton>
          <PrimaryButton onClick={() => setScreen("dialogue")}>開始練習</PrimaryButton>
        </div>
      </AppFrame>
    );
  }

  if (screen === "dialogue") {
    return (
      <AppFrame>
        <Card className="p-5 space-y-4">
          <div className="text-sm text-slate-500">步驟 4 / 4</div>
          <div className="text-xl font-bold text-slate-800">和 AI 練習一下</div>
          <div className="space-y-3">
            <div className="max-w-[80%] rounded-2xl bg-sky-100 text-sky-900 px-4 py-3">AI：Hello!</div>
            <div className="ml-auto max-w-[80%] rounded-2xl bg-emerald-100 text-emerald-900 px-4 py-3">你：Hello</div>
            <div className="max-w-[80%] rounded-2xl bg-sky-100 text-sky-900 px-4 py-3">AI：What is your name?</div>
          </div>
          <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">提示：你可以說 My name is {userName || "Leo"}</div>

          <div className="text-center space-y-4 pt-2">
            <button
              onClick={() => {
                if (!isRecording) {
                  setIsRecording(true);
                  setRecorded(false);
                } else {
                  setIsRecording(false);
                  setRecorded(true);
                  setTranscript(`My name is ${userName || "Leo"}`);
                }
              }}
              className={`mx-auto h-24 w-24 rounded-full text-white text-3xl shadow-lg transition ${isRecording ? "bg-rose-500 animate-pulse" : "bg-emerald-500 hover:bg-emerald-600"}`}
            >
              🎤
            </button>
            <div className="text-slate-600">
              {isRecording ? "正在聆聽... 再點一次結束" : recorded ? `已錄下：${transcript}` : "點一下開始錄音"}
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <SecondaryButton onClick={() => setScreen("feedback")}>略過示範回饋</SecondaryButton>
          <PrimaryButton onClick={() => setScreen("feedback")}>送出分析</PrimaryButton>
        </div>
      </AppFrame>
    );
  }

  if (screen === "feedback") {
    return (
      <AppFrame>
        <Card className="p-6 text-center space-y-5">
          <div className="text-3xl">🌟</div>
          <div>
            <div className="text-2xl font-bold text-slate-800">做得很好！</div>
            <div className="text-slate-500 mt-1">你已經成功完成第一輪口說</div>
          </div>
          <div className="mx-auto h-28 w-28 rounded-full bg-emerald-50 border-8 border-emerald-200 flex items-center justify-center text-3xl font-bold text-emerald-700">
            {score}
          </div>
          <div className="space-y-3 text-left">
            <div className="rounded-2xl bg-white border border-slate-200 p-4">✅ 句子正確</div>
            <div className="rounded-2xl bg-white border border-slate-200 p-4">👍 聲音很清楚</div>
            <div className="rounded-2xl bg-white border border-slate-200 p-4">🔁 am 可以再清楚一點</div>
          </div>
        </Card>
        <div className="grid grid-cols-2 gap-3">
          <SecondaryButton onClick={() => setScreen("dialogue")}>再試一次</SecondaryButton>
          <PrimaryButton onClick={() => setScreen("done")}>完成今天課程</PrimaryButton>
        </div>
      </AppFrame>
    );
  }

  return (
    <AppFrame>
      <Card className="p-6 text-center space-y-5">
        <div className="text-6xl">🎉</div>
        <div className="text-3xl font-bold text-slate-800">你完成 Day 1！</div>
        <div className="text-slate-600">你已經成功開口說第一句英文了。</div>
        <div className="rounded-3xl bg-sky-50 p-5 text-left space-y-3">
          <div className="font-semibold text-slate-800">今天你學會了：</div>
          <div className="text-slate-700">✔ Hello</div>
          <div className="text-slate-700">✔ I am ___</div>
          <div className="text-slate-700">✔ My name is {userName || "Leo"}</div>
        </div>
        <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-800 text-sm">
          很好，明天我們會練習更完整的名字介紹。
        </div>
      </Card>
      <div className="grid grid-cols-2 gap-3">
        <SecondaryButton onClick={() => setScreen("home")}>回首頁</SecondaryButton>
        <PrimaryButton onClick={() => setScreen("home")}>明天繼續</PrimaryButton>
      </div>
    </AppFrame>
  );
}
