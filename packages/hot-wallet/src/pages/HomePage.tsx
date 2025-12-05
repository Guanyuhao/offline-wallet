import { Card, Button } from 'antd-mobile';
import { NavBar, SafeArea } from 'antd-mobile';

function HomePage() {
  return (
    <div
      style={{
        height: '100vh',
        minHeight: '-webkit-fill-available',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <SafeArea position="top" />
      <NavBar>热钱包</NavBar>

      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '16px',
        }}
      >
        <Card>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <h2>🔥 热钱包</h2>
            <p style={{ color: '#666' }}>联网交易助手，帮助冷钱包完成余额查询和交易广播</p>
            <Button color="primary" block>
              扫描二维码
            </Button>
          </div>
        </Card>
      </div>

      <SafeArea position="bottom" />
    </div>
  );
}

export default HomePage;
