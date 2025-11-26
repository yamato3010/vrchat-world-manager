import * as fs from 'fs'
import * as png from 'png-metadata'

interface PNGMetadata {
    [key: string]: string
}

interface ParseResult {
    metadata: PNGMetadata
    worldId: string | null
}

/**
 * PNG チャンクを解析してメタデータを抽出
 * VRChat のスクリーンショットには World ID が tEXt チャンクに含まれている
 */
export function parsePNGMetadata(filePath: string): ParseResult {
    const buffer = fs.readFileSync(filePath)
    const metadata: PNGMetadata = {}
    let worldId: string | null = null

    // load from file
    const s = png.readFileSync(filePath)
    // split
    const list = png.splitChunk(s)

    /** listの中のオブジェクトは以下のようになっている
    * [{
    *     size: 447,
    *     type: 'iTXt',
    *     data: 'Description\x00\x00\x00\x00\x00{"application":"VRCX","version":1,"author":{"id":"usr_35416a74-373f-4206-9c2a-edfd97a5aa82","displayName":"yamato3010"},"world":{"name":"182377994386","id":"wrld_7b9b82ab-c8d8-49b9-bb9d-6eda6a4edf7f","instanceId":"wrld_7b9b82ab-c8d8-49b9-bb9d-6eda6a4edf7f:57329~private(usr_35416a74-373f-4206-9c2a-edfd97a5aa82)~canRequestInvite~region(jp)"},"players":[{"id":"usr_35416a74-373f-4206-9c2a-edfd97a5aa82","displayName":"yamato3010"}]}',
    *     crc: -1331678118
    * },]
    * このリストの中でtype: 'iTXt'のオブジェクトを探してwrld_を含む文字列を探してその文字列を変数に格納する
    */

    list.forEach((chunk) => {
        if (chunk.type === 'iTXt' || chunk.type === 'tEXt' || chunk.type === 'zTXt') {
            const data = chunk.data.toString('binary') 
            // シングルクォーテーションかダブルクォーテーションで囲まれた wrld_ から始まる文字列を抽出
            // "wrld_..." または 'wrld_...'
            const match = data.match(/(["'])(wrld_[a-f0-9-]{36})\1/)

            if (match) {
                worldId = match[2]
                console.log('World ID found:', worldId)
            }
        }
    })

    return { metadata, worldId }
}
