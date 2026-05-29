const express = require('express');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.json());

let rankings = [];

app.post('/webhook', (req, res) => {

    const userId = req.body.userRequest.user.id;
    const message = req.body.userRequest.utterance;

    let responseText = '';

    // 게임 시작
    if (message === '게임 시작') {

        responseText =
        '첫 번째 문제!\n제주 전통 물통 이름은?';

    }

    // 정답
    else if (message === '물허벅') {

        rankings.push({
            user: userId,
            score: 100
        });

        responseText =
        '정답!\n100점 획득!';

    }

    // 랭킹
    else if (message === '랭킹') {

        responseText = '🏆 랭킹\n';

        rankings.forEach((r, index) => {

            responseText +=
            `${index + 1}위 - ${r.score}점\n`;

        });

    }

    else {

        responseText =
        '다시 입력해주세요.';
    }

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

app.listen(3000, () => {

    console.log('서버 실행중');

});
