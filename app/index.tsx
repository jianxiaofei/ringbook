import { Redirect } from 'expo-router';

// 重定向到书架 Tab (根 Tab 路由)
export default function Index() {
  return <Redirect href="/(tabs)" />;
}
