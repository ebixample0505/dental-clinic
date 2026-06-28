import { NextRequest, NextResponse } from 'next/server';

type MenuItem = {
  label: string;
  url: string;
};

type TabData = {
  tabAItems: MenuItem[];
  tabBItems: MenuItem[];
  tabALabel: string;
  tabBLabel: string;
};

export async function POST(req: NextRequest) {
  try {
    const { tabAItems, tabBItems, tabALabel, tabBLabel }: TabData = await req.json();
    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN ||
      'NjilBySvWVCa3UMa5T9/PMO7HDPwP9ACKIsQH6LI1OwoX7Z+WQwN1yLN475XRKv4/hIN7v3A2zc2/lQcZitUSK9K8LC2++Ta9II8+76LQQn2UTkr03iASyz9XYLNlfjSjn0BGmypcVqC4/7xErh5mAdB04t89/1O/w1cDnyilFU=';

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    // STEP 1: 既存のエイリアスを削除
    const aliasListRes = await fetch('https://api.line.me/v2/bot/richmenu/alias/list', { headers });
    const aliasListData = await aliasListRes.json();
    if (aliasListData.aliases) {
      for (const alias of aliasListData.aliases) {
        await fetch(
          `https://api.line.me/v2/bot/richmenu/alias/${alias.richMenuAliasId}`,
          { method: 'DELETE', headers }
        );
        console.log(`エイリアス削除: ${alias.richMenuAliasId}`);
      }
    }

    // STEP 2: 既存のリッチメニューを全削除
    const listRes = await fetch('https://api.line.me/v2/bot/richmenu/list', { headers });
    const listData = await listRes.json();
    if (listData.richmenus) {
      for (const menu of listData.richmenus) {
        await fetch(`https://api.line.me/v2/bot/richmenu/${menu.richMenuId}`, {
          method: 'DELETE',
          headers,
        });
      }
    }

    // STEP 3: リッチメニューを作成
    const createMenu = async (items: MenuItem[], label: string) => {
      const body = {
        size: { width: 2500, height: 1686 },
        selected: false,
        name: label,
        chatBarText: label,
        areas: items.map((item: MenuItem, i: number) => ({
          bounds: {
            x: i * 833,
            y: 0,
            width: 833,
            height: 1686,
          },
          action: {
            type: 'uri',
            label: item.label,
            uri: item.url,
          },
        })),
      };

      const res = await fetch('https://api.line.me/v2/bot/richmenu', {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      const data = await res.json();
      console.log(`${label} 作成結果:`, data);
      return data.richMenuId;
    };

    const tabAId = await createMenu(tabAItems, tabALabel);
    const tabBId = await createMenu(tabBItems, tabBLabel);

    console.log('タブA ID:', tabAId);
    console.log('タブB ID:', tabBId);

    // エイリアスとデフォルト設定は画像アップロード後に行うため
    // IDのみ返す
    return NextResponse.json({ success: true, tabAId, tabBId });
  } catch (error) {
    console.error('エラー:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN ||
      'NjilBySvWVCa3UMa5T9/PMO7HDPwP9ACKIsQH6LI1OwoX7Z+WQwN1yLN475XRKv4/hIN7v3A2zc2/lQcZitUSK9K8LC2++Ta9II8+76LQQn2UTkr03iASyz9XYLNlfjSjn0BGmypcVqC4/7xErh5mAdB04t89/1O/w1cDnyilFU=';

    const formData = await req.formData();
    const image = formData.get('image') as File;
    const richMenuId = formData.get('richMenuId') as string;
    const isDefault = formData.get('isDefault') === 'true';
    const tabAId = formData.get('tabAId') as string;
    const tabBId = formData.get('tabBId') as string;
    const isLastUpload = formData.get('isLastUpload') === 'true';

    console.log('画像アップロード richMenuId:', richMenuId);
    console.log('isDefault:', isDefault);
    console.log('isLastUpload:', isLastUpload);

    if (!image || !richMenuId) {
      return NextResponse.json({ error: 'Missing image or richMenuId' }, { status: 400 });
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    const imageBuffer = await image.arrayBuffer();
    const contentType = image.type || 'image/jpeg';

    // 画像アップロード
    const uploadRes = await fetch(
      `https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`,
      {
        method: 'POST',
        headers: {
          'Content-Type': contentType,
          'Authorization': `Bearer ${token}`,
        },
        body: imageBuffer,
      }
    );

    console.log('画像アップロード結果:', uploadRes.status);

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      return NextResponse.json({ error: err }, { status: 400 });
    }

    // 両方の画像アップロード完了後にエイリアスとデフォルト設定
    if (isLastUpload && tabAId && tabBId) {
      // エイリアスA作成
      const aliasARes = await fetch('https://api.line.me/v2/bot/richmenu/alias', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          richMenuAliasId: 'tab-a',
          richMenuId: tabAId,
        }),
      });
      console.log('エイリアスA作成:', aliasARes.status, await aliasARes.text());

      // エイリアスB作成
      const aliasBRes = await fetch('https://api.line.me/v2/bot/richmenu/alias', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          richMenuAliasId: 'tab-b',
          richMenuId: tabBId,
        }),
      });
      console.log('エイリアスB作成:', aliasBRes.status, await aliasBRes.text());

      // タブAをデフォルトに設定
      const setDefaultRes = await fetch(
        `https://api.line.me/v2/bot/user/all/richmenu/${tabAId}`,
        { method: 'POST', headers }
      );
      console.log('デフォルト設定:', setDefaultRes.status, await setDefaultRes.text());
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('エラー:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}