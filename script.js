// 定数
const COLORS = ['red', 'blue', 'green'];
const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const HAND_SIZE = 5;
const TOTAL_CARDS = COLORS.length * NUMBERS.length;
const TRANSPARENT_CARD_COUNT = Math.floor(TOTAL_CARDS * (3 / 4)); // 全カードの3/4を何らかの形で透けさせる方針 (初期案)
const TRANSPARENT_TYPES = ['colorOnly', 'numberOnly', 'both']; // 透け方の種類

// ゲームの状態 (グローバル変数)
let deck = [];
let playerHand = []; // 自分プレイヤーの手札
// let opponentHand = []; // 対戦相手の手札 (今回はまず自分の手札表示から)
let playerScore = 0;
let opponentScore = 0;
// 他にもゲーム進行に必要な状態変数を後で追加

// DOM要素のキャッシュ
const playerHandDiv = document.getElementById('player-hand');
const playerDeckDiv = document.getElementById('player-deck'); // 山札の見た目操作用
const opponentDeckDiv = document.getElementById('opponent-deck');
const playerScoreSpan = document.getElementById('player-score');
const opponentScoreSpan = document.getElementById('opponent-score');
const messageAreaDiv = document.getElementById('message-area');

// --- カード関連の関数 ---
function createCard(number, color, id) {
    return {
        id: id,
        number: number,
        color: color,
        isTransparent: false, // デフォルトでは透けない
        transparentType: 'none', // 'none', 'colorOnly', 'numberOnly', 'both'
        revealedToPlayer: false // プレイヤーに完全に見えたかどうかのフラグ（山札の透け方とは別）
    };
}

function initializeDeck() {
    deck = [];
    let cardIdCounter = 0;
    for (const color of COLORS) {
        for (const number of NUMBERS) {
            deck.push(createCard(number, color, `card-${cardIdCounter++}`));
        }
    }
}

function shuffleDeck() {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

// 対戦ごとにランダムなカードを透けさせる処理
function setTransparentCards() {
    // まず全カードを非透過に戻す (再シャッフル時などのため)
    deck.forEach(card => {
        card.isTransparent = false;
        card.transparentType = 'none';
    });

    // ランダムにカードを選んで透けさせる
    const deckIndices = [...Array(deck.length).keys()]; // 0からdeck.length-1までのインデックス配列
    shuffleArray(deckIndices); // インデックスをシャッフル

    for (let i = 0; i < TRANSPARENT_CARD_COUNT; i++) {
        if (i >= deckIndices.length) break; // 万が一インデックスが足りなくなったら終了
        const cardIndex = deckIndices[i];
        const randomTypeIndex = Math.floor(Math.random() * TRANSPARENT_TYPES.length);

        deck[cardIndex].isTransparent = true;
        deck[cardIndex].transparentType = TRANSPARENT_TYPES[randomTypeIndex];
    }
}
// 配列シャッフルユーティリティ (setTransparentCards内で使用)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}


function dealInitialHands() {
    playerHand = [];
    // opponentHand = [];
    for (let i = 0; i < HAND_SIZE; i++) {
        if (deck.length > 0) {
            playerHand.push(deck.pop());
        }
        // if (deck.length > 0) { // 対戦相手も同様に
        //     opponentHand.push(deck.pop());
        // }
    }
}

// --- UI描画関連の関数 ---
function renderCard(cardData, isOpponentCard = false) {
    const cardDiv = document.createElement('div');
    cardDiv.classList.add('card');
    cardDiv.dataset.cardId = cardData.id; // データ属性としてカードIDを保持

    // --- 色の決定 ---
    // 手札のカードや完全に公開された場のカードは色が見える
    // 山札のカードや相手の裏向きのカードは、透け方によって色が変わる
    let displayColor = cardData.color;
    let numberVisible = true;
    let colorVisible = true;

    if (cardData.isTransparent && !cardData.revealedToPlayer && !isOpponentCard) { //自分の山札の透けてるカードなど
        cardDiv.classList.add('transparent'); // 透明であることを示す基本クラス
        switch (cardData.transparentType) {
            case 'colorOnly': // 色だけ見える (数字は見えない)
                numberVisible = false;
                cardDiv.classList.add(`transparent-color`);
                break;
            case 'numberOnly': // 数字だけ見える (色は見えない -> グレー背景などに)
                colorVisible = false;
                displayColor = 'grey'; // 仮の見た目、CSSで調整
                cardDiv.classList.add(`transparent-number`);
                break;
            case 'both': // 両方見える（ただし「透けている」ことが分かるように少し見た目を変えるか、CSSで区別）
                // この場合は、基本的には見えるが、CSSで「透けている枠」などを表現
                cardDiv.classList.add(`transparent-both`);
                break;
            default: // 'none' または予期せぬ値
                // 通常表示
                break;
        }
    } else if (!cardData.revealedToPlayer && isOpponentCard) { // 相手のセットした裏向きカードなど
        // 裏向きカードの表示 (色は見せない)
        displayColor = 'facedown'; // CSSで裏向きスタイルを定義
        numberVisible = false;
        colorVisible = false;
        cardDiv.classList.add('facedown');
    }
    // 手札のカードや公開されたカードは普通に色を適用
    if (colorVisible) {
        cardDiv.classList.add(displayColor); // red, blue, green, grey, facedown
    }


    // --- 数字の表示 ---
    const numberSpan = document.createElement('span');
    numberSpan.classList.add('number');
    if (numberVisible) {
        numberSpan.textContent = cardData.number;
    } else {
        numberSpan.textContent = '?'; // 数字が見えない場合は ? など
    }
    cardDiv.appendChild(numberSpan);

    // --- 色を示すインジケータ（例：カード下部など、デザインによる） ---
    // const colorIndicatorSpan = document.createElement('span');
    // colorIndicatorSpan.classList.add('color-indicator');
    // if (colorVisible) {
    //     colorIndicatorSpan.textContent = cardData.color.substring(0,1).toUpperCase(); // R, G, B
    // }
    // cardDiv.appendChild(colorIndicatorSpan);

    // クリックイベント（手札のカード選択など）は後で追加

    return cardDiv;
}

function renderPlayerHand() {
    playerHandDiv.innerHTML = ''; // 表示をクリア
    playerHand.forEach(card => {
        // 手札のカードは常に全て見える
        const handCard = {...card, isTransparent: false, revealedToPlayer: true };
        playerHandDiv.appendChild(renderCard(handCard));
    });
}

// 山札の表示（一番上のカードだけ透けて見えるようにする例）
function renderDecks() {
    // 自分の山札
    playerDeckDiv.innerHTML = ''; // クリア
    if (deck.length > 0) {
        // 山札の一番上のカードだけ描画（透けるルール適用）
        const topCardData = deck[deck.length - 1];
        const topCardDiv = renderCard(topCardData, false); // isOpponentCard = false
        topCardDiv.title = `山札: ${deck.length}枚`; //枚数表示
        playerDeckDiv.appendChild(topCardDiv);
    } else {
        playerDeckDiv.textContent = '山(0)';
    }

    // 相手の山札 (同様に)
    // opponentDeckDiv.innerHTML = '';
    // if (opponentDeck.length > 0) { ... }
    // 今回はまず自分の表示から
}


function updateScores() {
    playerScoreSpan.textContent = `自分スコア: ${playerScore}`;
    opponentScoreSpan.textContent = `相手スコア: ${opponentScore}`;
}

function displayMessage(message) {
    messageAreaDiv.textContent = message;
}

// --- ゲーム初期化と開始 ---
function setupGame() {
    initializeDeck();
    setTransparentCards(); // 山札に透けるカードを設定
    shuffleDeck();
    dealInitialHands();

    renderPlayerHand();
    renderDecks(); // 山札の表示も更新
    updateScores();
    displayMessage("ゲーム開始！あなたのターンです。");
    // TODO: 最初のターンプレイヤーのセットフェイズへ移行
}

// --- イベントリスナーなど（後で追加） ---


// --- ゲーム実行 ---
document.addEventListener('DOMContentLoaded', setupGame); // DOMが読み込まれたらゲーム開始
