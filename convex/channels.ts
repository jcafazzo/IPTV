import { query, mutation } from "./_generated/server";


// Initial seed data from the original application
const SEED_CHANNELS = [
    { name: 'Aunar', url: 'https://5fb24b460df87.streamlock.net/live-cont.ar/mirador/playlist.m3u8', group: 'Argentina', type: 'm3u8' },
    { name: 'Cine.AR', url: 'https://5fb24b460df87.streamlock.net/live-cont.ar/cinear/playlist.m3u8', group: 'Argentina', type: 'm3u8' },
    { name: 'Tec TV', url: 'https://tv.initium.net.ar:3939/live/tectvmainlive.m3u8', group: 'Argentina', type: 'm3u8' },
    { name: 'DeporTV', url: 'https://5fb24b460df87.streamlock.net/live-cont.ar/deportv/playlist.m3u8', group: 'Argentina', type: 'm3u8' },
    { name: 'Canal E', url: 'https://unlimited1-us.dps.live/perfiltv/perfiltv.smil/perfiltv/livestream2/chunks.m3u8', group: 'Argentina', type: 'm3u8' },
    { name: 'Telemax', url: 'https://live-edge01.telecentro.net.ar/live/smil:tlx.smil/playlist.m3u8', group: 'Argentina', type: 'm3u8' },
    { name: 'Net TV', url: 'https://unlimited1-us.dps.live/nettv/nettv.smil/playlist.m3u8', group: 'Argentina', type: 'm3u8' },
    { name: 'TV Universidad', url: 'https://stratus.stream.cespi.unlp.edu.ar/hls/tvunlp.m3u8', group: 'Argentina', type: 'm3u8' },
    { name: 'Urbana Tevé', url: 'https://cdnhd.iblups.com/hls/DD3nXkAkWk.m3u8', group: 'Argentina', type: 'm3u8' },
    { name: 'El Trece', url: 'https://live-01-02-eltrece.vodgc.net/eltrecetv/index.m3u8', group: 'Argentina', type: 'm3u8' },
    { name: 'El Nueve', url: 'https://octubre-live.cdn.vustreams.com/live/channel09/live.isml/live.m3u8', group: 'Argentina', type: 'm3u8' },

    // New Additions
    { name: 'Telefe HD', url: 'http://test_deportv-lh.akamaihd.net/i/TelefeHD_1@7273/index_1_av-p.m3u8', group: 'Argentina', type: 'm3u8' },
    { name: 'El Trece HD', url: 'rtsp://stream.eltrecetv.com.ar/live13/13tv/13tv1', group: 'Argentina', type: 'm3u8' },
    { name: 'Canal 9 HD', url: 'rtmp://sl100tb.cxnlive.com/live/canal9.stream', group: 'Argentina', type: 'm3u8' },
    { name: 'TV Publica HD', url: 'rtmp://sl100tb.cxnlive.com/live/tvpublica.stream', group: 'Argentina', type: 'm3u8' },
    { name: 'TyC Sports HD', url: 'rtmp://sl100tb.cxnlive.com/live/tyc.stream', group: 'Argentina', type: 'm3u8' },
    { name: 'TN HD', url: 'rtsp://stream.tn.com.ar/live/tnhd1', group: 'Argentina', type: 'm3u8' },
    { name: 'C5N', url: 'http://c5n.stweb.tv:1935/c5n/live_media/playlist.m3u8', group: 'Argentina', type: 'm3u8' },
    { name: 'Canal 26 HD', url: 'rtsp://live-edge01.telecentro.net.ar:80/live/26hd-720', group: 'Argentina', type: 'm3u8' },
    { name: 'ESPN +', url: 'http://www.ienlace-tv.com:1935/live7/livestream1.sdp/playlist.m3u8', group: 'Argentina', type: 'm3u8' },
    { name: 'Magazine TV', url: 'rtsp://stream.mgzn.tv/live/mgzntv/mgzntv', group: 'Argentina', type: 'm3u8' },
    { name: 'History', url: 'http://www.ienlace-tv.com:1935/live10/livestream1.sdp/playlist.m3u8', group: 'Argentina', type: 'm3u8' },
    { name: 'Boomerang', url: 'http://www.ienlace-tv.com:1935/live11/livestream1.sdp/playlist.m3u8', group: 'Argentina', type: 'm3u8' },
    { name: 'Discovery Kids', url: 'http://www.ienlace-tv.com:1935/live6/livestream1.sdp/playlist.m3u8', group: 'Argentina', type: 'm3u8' },
    { name: 'Q Musica', url: 'mms://streamqm.uigc.net/qmusica', group: 'Argentina', type: 'm3u8' },
    { name: 'Deportv HD', url: 'rtmp://sl100tb.cxnlive.com/live/deportv.stream', group: 'Argentina', type: 'm3u8' },
    { name: 'America TV', url: 'rtmp://wdc.cxnlive.com/live/americasd.stream', group: 'Argentina', type: 'm3u8' },
    { name: 'NatGeo HD', url: 'http://ilg.club/streamlink.m3u8?channel_id=7ad09373f65c48d5bb6aa6c3b2ca519a&bitrate=800', group: 'International', type: 'm3u8' },
    { name: 'NatGeo Wild HD', url: 'http://ilg.club/streamlink.m3u8?channel_id=607fa33938bc4a3ea6c43ce47ddb8ed8&bitrate=800', group: 'International', type: 'm3u8' },
    { name: 'FX HD', url: 'http://ilg.club/streamlink.m3u8?channel_id=2e0e4b05aa6e428593f3b45b710045b7&bitrate=800', group: 'International', type: 'm3u8' },
    { name: 'Star World HD', url: 'http://ilg.club/streamlink.m3u8?channel_id=65f7358b813048a0898f5677e1793cf9&bitrate=800', group: 'International', type: 'm3u8' },
    { name: 'Nat Geo Music HD', url: 'http://ilg.club/streamlink.m3u8?channel_id=69c2eab6794344619a049c5dea60ca22&bitrate=800', group: 'International', type: 'm3u8' },
    { name: 'Baby TV HD', url: 'http://ilg.club/streamlink.m3u8?channel_id=7773f3cef0334a28ad248552ea63d9e7&bitrate=800', group: 'International', type: 'm3u8' },
    { name: 'SyFy HD', url: 'http://ilg.club/streamlink.m3u8?channel_id=71f197de056e499a85265c03b44bdab1&bitrate=800', group: 'International', type: 'm3u8' },
    { name: 'Comedy Central HD', url: 'http://ilg.club/streamlink.m3u8?channel_id=2f18d4ba25224edaa8bb9aac94b00d4f&bitrate=800', group: 'International', type: 'm3u8' },
    { name: 'Fox Sports', url: 'rtmp://wdc.cxnlive.com/live/foxsd.stream', group: 'Argentina', type: 'm3u8' },
    { name: 'ESPN', url: 'rtmp://wdc.cxnlive.com/live/espn.stream', group: 'Argentina', type: 'm3u8' },
    { name: 'Cronica TV', url: 'rtmp://wdc.cxnlive.com/live/cronica.stream', group: 'Argentina', type: 'm3u8' },
    { name: 'Telesur', url: 'http://cdn2.telesur.ultrabase.net/livecf/telesurLive/master.m3u8', group: 'International', type: 'm3u8' },
    { name: 'Telemax (Alt)', url: 'http://live-edge01.telecentro.net.ar/live/smil:tlx.smil/master.m3u8', group: 'Argentina', type: 'm3u8' },
];

export const get = query({
    args: {},
    handler: async (ctx) => {
        const channels = await ctx.db
            .query("channels")
            .withIndex("by_active_order", (q) => q.eq("active", true))
            .order("asc")
            .collect();
        return channels;
    },
});

export const seed = mutation({
    args: {},
    handler: async (ctx) => {
        // Clear existing channels to force update with new list
        const existing = await ctx.db.query("channels").collect();
        for (const ch of existing) {
            await ctx.db.delete(ch._id);
        }

        console.log("Seeding database with updated channels...");

        let order = 0;
        for (const ch of SEED_CHANNELS) {
            await ctx.db.insert("channels", {
                name: ch.name,
                url: ch.url,
                type: ch.type as "m3u8" | "youtube_video" | "youtube_live" | "iframe",
                active: true,
                category: ch.group,
                order: order++,
            });
        }
    },
});
