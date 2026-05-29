```javascript
const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');

const app = express();

app.use(bodyParser.json());

/*
Firebase 연결
*/
const serviceAccount =
require('./firebase-key.json');

admin.initializeApp({

    credential:
    admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

/*
유저 저장소
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
유저 저장 함수
*/
async function saveUser(userId) {

    await db
    .collection('users')
    .doc(userId)
    .set(users[userId]);
}

/*
기본 페이지
*/
app.get('/', (req, res) => {

    res.send('서버 정상 실행중');
});

/*
카카오 webhook
*/
app.post('/webhook', async (req, res) => {

    try {

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

                state:
                'waitingNickname',

                startTime: null,

                endTime: null,

                clearTime: null
            };

            responseText =

            '사용할 닉네임을 입력해주세요.\n\n' +

            '예시:\n' +

            '닉네임 바당';
        }

        /*
        닉네임 입력
        */
        else if (

            users[userId]?.state ===
            'waitingNickname'

            &&

            message.startsWith('닉네임 ')

        ) {

            const nickname =

            message.replace(
                '닉네임 ',
                ''
            );

            /*
            중복 검사
            */
            let isDuplicate = false;

            for (const id in users) {

                if (

                    users[id].nickname ===
                    nickname

                ) {

                    isDuplicate = true;
                }
            }

            /*
            중복이면
            */
            if (isDuplicate) {

                responseText =

                '이미 사용중인 닉네임입니다.';
            }

            /*
            중복 아니면
            */
            else {

                users[userId].nickname =
                nickname;

                users[userId].state =
                'playing';

                users[userId].startTime =
                Date.now();

                await saveUser(userId);

                responseText =

                `${nickname}님 게임 시작!`;
            }
        }

        /*
        1단계 완료
        */
        else if (message === '1번 완료') {

            responseText =
            '1단계 완료!';
        }

        /*
        게임 종료
        */
        else if (message === '게임 종료') {

            users[userId].endTime =
            Date.now();

            users[userId].clearTime =

                users[userId].endTime

                -

                users[userId].startTime;

            await saveUser(userId);

            responseText =

                '🎉 게임 완료!\n\n' +

                '플레이 시간 : ' +

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

            rankingArray =

            rankingArray.filter(user =>

                user.clearTime !== null
            );

            rankingArray.sort((a, b) => {

                return a.clearTime
                -
                b.clearTime;
            });

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

            '인식할 수 없는 명령입니다.';
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
    }

    catch(error) {

        console.log(error);

        res.json({

            version: '2.0',

            template: {

                outputs: [

                    {

                        simpleText: {

                            text:
                            '서버 오류 발생'
                        }
                    }
                ]
            }
        });
    }
});

/*
서버 실행
*/
const PORT =
process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(

        `서버 실행중 : ${PORT}`
    );
});
```

