const express = require('express');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.json());

/*
사용자 저장 공간
*/
let users = {};

/*
시간 포맷 함수
*/
function formatTime(ms) {

    let totalSeconds =
    Math.floor(ms / 1000);

    let minutes =
    Math.floor(totalSeconds / 60);

    let seconds =
    totalSeconds % 60;

    return `${minutes}분 ${seconds}초`;
}

/*
Webhook
*/
app.post('/webhook', (req, res) => {

    const userId =
    req.body.userRequest.user.id;

    const message =
    req.body.userRequest.utterance;
    console.log('입력값:', message);
    
    let responseText = '';

    /*
    게임 시작
    */
    if (message === '게임 시작') {

        users[userId] = {

            nickname: '',

            state: 'waitingNickname',

            stage: 0,

            startTime: null,

            endTime: null,

            clearTime: null

        };

        responseText =
        '사용할 닉네임을 입력해주세요.';
    }

    /*
    닉네임 입력 처리
    */
    else if (

    users[userId]?.state ===
    'waitingNickname'

    &&

    message.startsWith('닉네임 ')

) {

        /*
        닉네임 중복 검사
        */
        let isDuplicate = false;

        for (const id in users) {

            if (
                users[id].nickname === message
            ) {

                isDuplicate = true;
            }
        }

        /*
        중복일 경우
        */
        if (isDuplicate) {

            responseText =
            '이미 사용중인 닉네임입니다.\n다른 닉네임을 입력해주세요.';
        }

        /*
        사용 가능
        */
        else {

            const nickname =

message.replace(
'닉네임 ',
''
);

users[userId].nickname =
nickname;

            users[userId].state =
            'playing';

            users[userId].stage = 1;

            users[userId].startTime =
            Date.now();

            responseText =
            `${nickname}님 게임 시작!` +
            '첫 번째 장소로 이동하세요.';
        }
    }

    /*
    1번 완료
    */
    else if (
        message === '1번 완료'
    ) {

        users[userId].stage = 2;

        responseText =
        '1단계 완료!';
    }

    /*
    2번 완료
    */
    else if (
        message === '2번 완료'
    ) {

        users[userId].stage = 3;

        responseText =
        '2단계 완료!';
    }

    /*
    최종 완료
    */
    else if (
        message === '게임 종료'
    ) {

        users[userId].endTime =
        Date.now();

        users[userId].clearTime =

            users[userId].endTime
            -
            users[userId].startTime;

        responseText =

            `🎉 게임 완료!\n\n` +

            `플레이 시간: ` +

            formatTime(
                users[userId].clearTime
            );
    }

    /*
    랭킹
    */
    else if (message === '랭킹') {

        responseText =
        '🏆 실시간 랭킹\n\n';

        let rankingArray =
        Object.values(users);

        /*
        완료한 사람만
        */
        rankingArray =
        rankingArray.filter(user =>

            user.clearTime !== null

        );

        /*
        시간 짧은 순 정렬
        */
        rankingArray.sort((a, b) => {

            return a.clearTime -
                   b.clearTime;
        });

        /*
        TOP 10 출력
        */
        rankingArray
        .slice(0, 10)
        .forEach((user, index) => {

            responseText +=

                `${index + 1}위 ` +

                `${user.nickname} - ` +

                `${formatTime(
                    user.clearTime
                )}\n`;
        });
    }

    /*
    기본 응답
    */
    else {

        responseText =
        '진행중인 게임이 없습니다.';
    }

    /*
    카카오 응답
    */
    res.json({

        version: '2.0',

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
서버 실행
*/
app.listen(3000, () => {

    console.log('서버 실행중');
});
