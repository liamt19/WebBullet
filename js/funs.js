const m_Colors = ['w', 'b'];
const m_PieceTypes = ['P', 'N', 'B', 'R', 'Q', 'K'];

function parseRawBytes(byteString) {
    let byteArray = byteString
        .replace(/\s+/g, '')
        .match(/.{1,2}/g)
        .map(byte => parseInt(byte, 16));

    let revd = byteArray.slice(0, 8).reverse();
    let occ = 0n;
    for (let i = 0; i < 8; i++) {
        occ = (occ << 8n) | BigInt(revd[i]);
    }

    let score = bytesToSignedInt16(byteArray[24], byteArray[25]);

    return {
        occupancy: occ,
        pcs: byteArray.slice(8, 24),
        score: score,
        result: byteArray[26],
        ksq: byteArray[27],
        opp_ksq: byteArray[28],
        pad: byteArray.slice(29, 3),
    };
}

function handlePiecesArray(pieces, occ) {
    var pList = [];
    idx = 0;
    while (occ != 0) {
        let sq = tzcnt(occ)
        occ = occ & (occ - 1n);

        let sqName = String.fromCharCode(97 + (sq & 7)) + ((sq >> 3) + 1);

        let piece = (pieces[Math.floor(idx / 2)] >> (4 * (idx & 1))) & 0b1111;
        let pColor = Math.floor(piece / 8);
        let pType = piece % 8;

        pList.push({
            [sqName]: (m_Colors[pColor] + m_PieceTypes[pType])
        });

        idx += 1
    }

    return pList;
}

function tzcnt(num) {
    if (num == 0)
        return 64;

    let count = 0;
    while ((num & 1n) == 0) {
        count++;
        num >>= 1n;
    }

    return count;
}

function bytesToSignedInt16(byte1, byte2) {
    const dataView = new DataView(new ArrayBuffer(2));
    dataView.setUint8(0, byte1);
    dataView.setUint8(1, byte2);
    return dataView.getInt16(0, true);
}

function parseData() {
    var input = $(rawDataField);
    var val = input.val();

    if (input.data("lastval") != val) {
        input.data("lastval", val);
        let result = parseRawBytes(val);

        $('#tfOccupancy').text(result.occupancy)
        $('#tfPcs').text(result.pcs.join(' '))
        $('#tfScore').text(result.score)
        $('#tfResult').text(result.result)
        $('#tfKsq').text(result.ksq)
        $('#tfOppKsq').text(result.opp_ksq)

        let piecesArray = handlePiecesArray(result.pcs, result.occupancy)
        const postn = piecesArray.reduce((accumulator, current) => {
            const k = Object.keys(current)[0];
            accumulator[k] = current[k];
            return accumulator;
        }, {});

        board.position(postn)

        let fen = board.fen();
        fen = fen + " w KQkq - 0 1"
        $('#tfFEN').text(fen)
    }
}