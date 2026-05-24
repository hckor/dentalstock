import { Component } from "react";
import { CS, T, font } from "../constants/colors";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorChildrenType: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  static getDerivedStateFromProps(props, state) {
    // 에러가 있는 상태에서 children type이 바뀌면 자동으로 에러 상태 초기화
    if (state.hasError && state.errorChildrenType !== null) {
      const newType = props.children?.type ?? null;
      if (newType !== state.errorChildrenType) {
        return { hasError: false, error: null, errorChildrenType: null };
      }
    }
    return null;
  }

  componentDidCatch(error, info) {
    // 에러를 유발한 children type을 기록
    this.setState({ errorChildrenType: this.props.children?.type ?? null });
    if (typeof window !== "undefined" && window.console) {
      console.error("[ErrorBoundary]", error, info);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorChildrenType: null });
  };

  handleReload = () => {
    if (typeof window !== "undefined") window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: T.surfaceMuted,
        padding: 20,
        fontFamily: font,
      }}>
        <div style={{
          maxWidth: 360,
          background: T.surface,
          borderRadius: 16,
          padding: 32,
          textAlign: "center",
          boxShadow: CS,
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
          <h1 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: T.textStrong }}>
            앗, 문제가 발생했어요
          </h1>
          <p style={{ margin: "0 0 20px", fontSize: 12, color: T.textMuted, lineHeight: 1.5 }}>
            일시적인 오류가 발생했어요. 새로고침 또는 다시 시도해주세요.
          </p>
          {this.state.error && (
            <pre style={{
              background: T.surfaceSubtle,
              borderRadius: 8,
              padding: 12,
              fontSize: 12,
              color: T.textSubtle,
              textAlign: "left",
              overflow: "auto",
              maxHeight: 120,
              marginBottom: 20,
            }}>{String(this.state.error?.message || this.state.error)}</pre>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <button onClick={this.handleReset} style={{
              padding: "12px 0",
              borderRadius: 9999,
              border: `1.5px solid ${T.line}`,
              background: T.surface,
              color: T.grey700,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}>다시 시도</button>
            <button onClick={this.handleReload} style={{
              padding: "12px 0",
              borderRadius: 9999,
              border: "none",
              background: T.primary,
              color: T.white,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}>새로고침</button>
          </div>
        </div>
      </div>
    );
  }
}
