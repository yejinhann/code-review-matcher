const https = require("https");

// 팀원 이름
const MEMBERS = ["예진", "두영", "재명", "소민"];

// 이모지 풀
const EMOJIS = ["🔥", "⚡", "🎯", "🚀", "💻", "🎨", "✨", "🌟", "💪", "🎮"];

// 랜덤 셔플 함수
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// 매칭 생성
function createAssignments() {
  const shuffled = shuffle(MEMBERS);
  const assignments = [];

  for (let i = 0; i < shuffled.length; i++) {
    const reviewer = shuffled[i];
    const reviewee = shuffled[(i + 1) % shuffled.length];
    assignments.push({ reviewer, reviewee });
  }

  return assignments;
}

// 슬랙 메시지 생성
function createSlackMessage(assignments) {
  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];

  const blocks = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `${emoji} 오늘의 코드리뷰 대진표 ${emoji}`,
        emoji: true,
      },
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `📅 ${today} | 모두 화이팅! 💪`,
        },
      ],
    },
    {
      type: "divider",
    },
  ];

  // 매칭 정보 추가
  assignments.forEach(({ reviewer, reviewee }) => {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${reviewer}* ➜ *${reviewee}*`,
      },
    });
  });

  blocks.push({ type: "divider" });
  blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: "💡 _서로의 코드에서 배우는 하루 되세요!_ 🎉",
      },
    ],
  });

  return { blocks };
}

// 슬랙으로 전송
function sendToSlack(message) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    console.error("❌ SLACK_WEBHOOK_URL 환경변수가 설정되지 않았습니다!");
    process.exit(1);
  }

  const url = new URL(webhookUrl);
  const postData = JSON.stringify(message);

  const options = {
    hostname: url.hostname,
    path: url.pathname,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(postData),
    },
  };

  const req = https.request(options, (res) => {
    if (res.statusCode === 200) {
      console.log("✅ 슬랙 메시지 전송 성공!");
    } else {
      console.error(`❌ 슬랙 메시지 전송 실패: ${res.statusCode}`);
      process.exit(1);
    }
  });

  req.on("error", (error) => {
    console.error("❌ 전송 오류:", error);
    process.exit(1);
  });

  req.write(postData);
  req.end();
}

// 메인 실행
console.log("🎲 코드 리뷰 매칭 시작...\n");

const assignments = createAssignments();

console.log("📋 오늘의 매칭:");
assignments.forEach(({ reviewer, reviewee }) => {
  console.log(`  ${reviewer} → ${reviewee}`);
});

const message = createSlackMessage(assignments);
sendToSlack(message);
