const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

/*
유저 데이터 (임시 저장)
*/
let users = {};

/*
시간 포맷 함수 (오류 없는 안전 버전)
*/
function formatTime(ms) {

    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return minutes + '분 ' + seconds + '초';
}

/*
홈
*/
app.get('/', (req, res) => {
    res.send('Jeju Game Server Running');
});

/*
카카오 webhook
*/
app.post('/webhook', (req, res) => {

    const userId = req.body.userRequest.user.id;
    const message = req.body.userRequest.utterance;

    console.log('입력값:', message);

    let responseText = '';

    /*
    1. 게임 시작
    */
    if (message === '게임 시작') {

        users[userId] = {
            nickname: null,
            state: 'WAIT_NICKNAME',
            startTime: null,
            endTime: null,
            playTime: null
        };

        responseText =
            '게임 시작!\n닉네임을 입력하세요.\n예: 닉네임 바당';
    }

    /*
    2. 닉네임 입력 처리
    */
    else if (
        users[userId] &&
        users[userId].state === 'WAIT_NICKNAME' &&
        message.startsWith('닉네임 ')
    ) {

        const nickname = message.replace('닉네임 ', '');

        /*
        중복 검사
        */
        let duplicate = false;

        for (const id in users) {
            if (users[id].nickname === nickname) {
                duplicate = true;
            }
        }

        if (duplicate) {
            responseText = '이미 존재하는 닉네임입니다.';
        }

        else {

            users[userId].nickname = nickname;
            users[userId].state = 'QUESTION_1';
            users[userId].startTime = Date.now();

            responseText =
    nickname + '님 게임 시작!\n\n' +
    '1번 문제\n' +
    '이곳은 제주를 지키던 환해장성입니다.\n' +
    '돌담의 길이는 몇m일까요?';
        }
    }
    /*
3. 1번 문제 정답 처리
*/
else if (
    users[userId] &&
    users[userId].state === 'QUESTION_1' &&
    message === '30m'
) {

    users[userId].state = 'PLAYING';

    responseText =
        '정답입니다!\n' +
        '다음 미션을 진행하세요.';
}
    /*
    4. 게임 종료
    */
    else if (message === '게임 종료') {

        if (users[userId]) {

            users[userId].endTime = Date.now();

            users[userId].playTime =
                users[userId].endTime -
                users[userId].startTime;

            responseText =
                '게임 종료!\n' +
                '기록: ' +
                formatTime(users[userId].playTime);
        }
    }

    /*
    4. 랭킹
    */
    else if (message === '랭킹') {

        let list = Object.values(users)
            .filter(u => u.playTime)
            .sort((a, b) => a.playTime - b.playTime);

        responseText = '🏆 랭킹\n\n';

        list.slice(0, 10).forEach((u, i) => {
            responseText +=
                (i + 1) + '위 ' +
                u.nickname + ' - ' +
                formatTime(u.playTime) + '\n';
        });
    }

    /*
    기본 응답
    */
    else {
        responseText = '명령을 이해하지 못했습니다.';
    }

    /*
    카카오 응답
    */
    res.json({
        version: "2.0",
        template: {
            outputs: [
                {
                    simpleText: {
                        text: responseText
                    }
                }
            ]
        }
    });
});

/*
서버 실행 (Render 대응)
*/
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log('서버 실행중:', PORT);
});

