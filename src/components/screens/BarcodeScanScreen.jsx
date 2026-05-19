import { useState, useEffect, useRef, useMemo } from "react";
import { X, Keyboard, Minus, Plus, Flashlight, RotateCcw } from "lucide-react";
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";
import { T, font } from "../../constants/colors";
import { getStatus } from "../../utils/helpers";
import { ST } from "../../constants/itemStates";

export function BarcodeScanScreen({items, onSelect, onClose}) {
  const [query,      setQuery]      = useState("");
  const [selected,   setSelected]   = useState(null);
  const [qty,        setQty]        = useState(1);
  const [showInput,  setShowInput]  = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [camError,   setCamError]   = useState(null);
  const [camReady,   setCamReady]   = useState(false);
  const [deviceIdx,  setDeviceIdx]  = useState(0);
  const [devices,    setDevices]    = useState([]);

  const videoRef  = useRef(null);
  const readerRef = useRef(null);

  // ZXing 초기화 + 카메라 시작
  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    reader.listVideoInputDevices()
      .then(devs => {
        if (!devs.length) {
          setCamError("카메라를 찾을 수 없습니다");
          return;
        }
        setDevices(devs);
        // 후면 카메라 우선
        const backIdx = devs.findIndex(d =>
          /back|rear|environment|뒤/i.test(d.label)
        );
        const idx = backIdx >= 0 ? backIdx : 0;
        setDeviceIdx(idx);
        startCamera(reader, devs[idx].deviceId);
      })
      .catch(() => setCamError("카메라 권한을 허용해주세요"));

    return () => {
      try { reader.reset(); } catch (_) {}
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const startCamera = (reader, deviceId) => {
    if (!videoRef.current) return;
    setCamReady(false);
    setCamError(null);
    reader.decodeFromVideoDevice(deviceId, videoRef.current, (result, err) => {
      if (result) {
        const text = result.getText();
        setScanResult(text);
        // 품목명에서 매칭 시도
        const matched = items.find(i =>
          i.name.includes(text) || (i.barcode && i.barcode === text)
        );
        if (matched) {
          setSelected(matched);
          setQty(1);
          try { reader.reset(); } catch (_) {}
        }
      }
      if (err && !(err instanceof NotFoundException)) {
        // 스캔 중 일반 에러는 무시 (매 프레임 호출됨)
      }
    });
    // 비디오 로드 감지
    if (videoRef.current) {
      videoRef.current.onloadedmetadata = () => setCamReady(true);
    }
  };

  const switchCamera = () => {
    if (devices.length < 2) return;
    const nextIdx = (deviceIdx + 1) % devices.length;
    setDeviceIdx(nextIdx);
    try { readerRef.current?.reset(); } catch (_) {}
    startCamera(readerRef.current, devices[nextIdx].deviceId);
  };

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return items.filter(i => i.name.includes(query.trim())).slice(0, 5);
  }, [query, items]);

  const handleSelect = (item) => {
    setSelected(item);
    setQty(1);
    setQuery("");
    setScanResult(null);
    try { readerRef.current?.reset(); } catch (_) {}
  };

  const handleAction = (type) => {
    if (selected) onSelect({item: selected, type, qty});
  };

  return (
    <div style={{position:"fixed", inset:0, zIndex:200, display:"flex", flexDirection:"column", background:"#000"}}>

      {/* 카메라 영역 */}
      <div style={{flex:1, position:"relative", overflow:"hidden"}}>

        {/* 실제 카메라 비디오 */}
        <video
          ref={videoRef}
          style={{width:"100%", height:"100%", objectFit:"cover", display:"block"}}
          autoPlay
          playsInline
          muted
        />

        {/* 어두운 오버레이 (중앙 제외) */}
        {camReady && !selected && (
          <>
            <div style={{position:"absolute", inset:"0 0 auto 0", height:"calc(50% - 110px)", background:"rgba(0,0,0,0.55)"}}/>
            <div style={{position:"absolute", inset:"auto 0 0 0", height:"calc(50% - 110px)", background:"rgba(0,0,0,0.55)"}}/>
            <div style={{position:"absolute", top:"calc(50% - 110px)", left:0, width:"calc(50% - 110px)", height:220, background:"rgba(0,0,0,0.55)"}}/>
            <div style={{position:"absolute", top:"calc(50% - 110px)", right:0, width:"calc(50% - 110px)", height:220, background:"rgba(0,0,0,0.55)"}}/>
          </>
        )}

        {/* 로딩 / 에러 상태 */}
        {!camReady && !camError && (
          <div style={{position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", background:"#0a0e14"}}>
            <div style={{textAlign:"center"}}>
              <div style={{width:36, height:36, border:"3px solid rgba(255,255,255,0.2)", borderTopColor:"#fff", borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 12px"}}/>
              <p style={{color:"rgba(255,255,255,0.7)", fontSize:13, margin:0}}>카메라 연결 중...</p>
            </div>
          </div>
        )}
        {camError && (
          <div style={{position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", background:"#0a0e14"}}>
            <div style={{textAlign:"center", padding:"0 32px"}}>
              <p style={{color:"#f87171", fontSize:15, fontWeight:600, margin:"0 0 6px"}}>{camError}</p>
              <p style={{color:"rgba(255,255,255,0.5)", fontSize:13, margin:0}}>아래 검색을 이용해주세요</p>
            </div>
          </div>
        )}

        {/* 스캔 프레임 (카메라 준비됐을 때만) */}
        {camReady && !selected && (
          <div style={{position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:220, height:220}}>
            {[{top:0,left:0},{top:0,right:0},{bottom:0,left:0},{bottom:0,right:0}].map((pos,i)=>(
              <div key={i} style={{position:"absolute", width:28, height:28, ...pos,
                borderTop:   pos.top   !==undefined?"3px solid #2563eb":"none",
                borderBottom:pos.bottom!==undefined?"3px solid #2563eb":"none",
                borderLeft:  pos.left  !==undefined?"3px solid #2563eb":"none",
                borderRight: pos.right !==undefined?"3px solid #2563eb":"none",
                borderRadius: pos.top!==undefined&&pos.left!==undefined?"4px 0 0 0":
                              pos.top!==undefined&&pos.right!==undefined?"0 4px 0 0":
                              pos.bottom!==undefined&&pos.left!==undefined?"0 0 0 4px":"0 0 4px 0",
              }}/>
            ))}
            {/* 스캔 라인 */}
            <div style={{position:"absolute", top:"42%", left:8, right:8, height:2, background:"rgba(37,99,235,0.8)", borderRadius:1, boxShadow:"0 0 8px #2563eb"}}/>
          </div>
        )}

        {/* 상단 컨트롤 바 */}
        <div style={{position:"absolute", top:0, left:0, right:0, padding:"54px 16px 16px", display:"flex", alignItems:"center", justifyContent:"space-between"}}>
          <button onClick={onClose} style={{width:36, height:36, borderRadius:9999, border:"none", background:"rgba(0,0,0,0.4)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center"}}>
            <X size={18} color="#fff"/>
          </button>
          <p style={{margin:0, fontSize:16, fontWeight:700, color:"#fff"}}>바코드 스캔</p>
          <div style={{display:"flex", gap:8}}>
            {devices.length > 1 && (
              <button onClick={switchCamera} style={{width:36, height:36, borderRadius:9999, border:"none", background:"rgba(0,0,0,0.4)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center"}}>
                <RotateCcw size={16} color="#fff"/>
              </button>
            )}
            <button onClick={()=>setShowInput(v=>!v)} style={{height:36, padding:"0 12px", borderRadius:9999, border:"none", background:showInput?"#2563eb":"rgba(0,0,0,0.4)", cursor:"pointer", fontFamily:font, fontSize:12, fontWeight:600, color:"#fff", display:"flex", alignItems:"center", gap:5}}>
              <Keyboard size={13}/> 직접 입력
            </button>
          </div>
        </div>

        {/* 스캔된 결과 표시 */}
        {scanResult && !selected && (
          <div style={{position:"absolute", bottom:170, left:16, right:16, background:"rgba(0,0,0,0.75)", borderRadius:12, padding:"10px 14px", textAlign:"center"}}>
            <p style={{margin:0, fontSize:12, color:"rgba(255,255,255,0.6)"}}>스캔됨</p>
            <p style={{margin:"2px 0 0", fontSize:14, fontWeight:700, color:"#fff"}}>{scanResult}</p>
            <p style={{margin:"2px 0 0", fontSize:12, color:"#f87171"}}>품목을 찾을 수 없어요 — 아래에서 검색해주세요</p>
          </div>
        )}

        {/* 하단 안내 */}
        {camReady && !selected && !scanResult && (
          <div style={{position:"absolute", bottom:170, left:0, right:0, textAlign:"center"}}>
            <p style={{margin:0, fontSize:13, color:"rgba(255,255,255,0.7)"}}>바코드를 사각 영역에 맞춰주세요</p>
            <p style={{margin:"4px 0 0", fontSize:11, color:"rgba(255,255,255,0.4)"}}>자동으로 인식됩니다</p>
          </div>
        )}
      </div>

      {/* 하단 시트 */}
      <div style={{background:T.white, borderRadius:"20px 20px 0 0", padding:"16px 16px 32px", minHeight:160, flexShrink:0}}>
        <div style={{display:"flex", justifyContent:"center", marginBottom:14}}>
          <div style={{width:36, height:4, borderRadius:9999, background:T.grey200}}/>
        </div>

        {/* 검색 입력 (직접 입력 모드 또는 항상 표시) */}
        {(!selected) && (
          <div style={{position:"relative", marginBottom:12}}>
            <input
              value={query}
              onChange={e=>setQuery(e.target.value)}
              placeholder="품목명으로 검색"
              autoFocus={showInput}
              style={{width:"100%", padding:"12px 14px", borderRadius:10, border:`1px solid ${T.grey200}`, background:T.grey50, fontSize:14, color:T.grey800, fontFamily:font, outline:"none", boxSizing:"border-box"}}
            />
          </div>
        )}

        {/* 검색 결과 */}
        {results.length > 0 && !selected && (
          <div style={{background:T.white, borderRadius:10, border:`1px solid ${T.grey200}`, overflow:"hidden", marginBottom:12}}>
            {results.map((item, i) => {
              const st = getStatus(item);
              const sc = ST[st];
              return (
                <div key={item.id}>
                  <button onClick={()=>handleSelect(item)} style={{width:"100%", padding:"12px 14px", border:"none", background:"none", cursor:"pointer", fontFamily:font, display:"flex", alignItems:"center", gap:10, textAlign:"left"}}>
                    <div style={{flex:1, minWidth:0}}>
                      <p style={{margin:0, fontSize:14, fontWeight:600, color:T.grey900, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{item.name}</p>
                      <p style={{margin:"1px 0 0", fontSize:12, color:T.grey500}}>현재 {item.current_qty}{item.unit}</p>
                    </div>
                    <span style={{flexShrink:0, fontSize:11, fontWeight:600, color:sc.text, background:sc.bg, padding:"3px 8px", borderRadius:9999}}>{sc.label}</span>
                  </button>
                  {i < results.length-1 && <div style={{height:1, background:T.grey100}}/>}
                </div>
              );
            })}
          </div>
        )}

        {/* 선택된 품목 */}
        {selected && (
          <div>
            <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14}}>
              <div>
                <p style={{margin:"0 0 2px", fontSize:11, color:T.green500, fontWeight:700}}>✓ 품목 확인</p>
                <p style={{margin:0, fontSize:18, fontWeight:700, color:T.grey900}}>{selected.name}</p>
                <p style={{margin:"2px 0 0", fontSize:12, color:T.grey500}}>현재 재고 <span style={{fontWeight:700, color:T.blue500}}>{selected.current_qty}{selected.unit}</span></p>
              </div>
              <button onClick={()=>{setSelected(null); setScanResult(null); startCamera(readerRef.current, devices[deviceIdx]?.deviceId);}} style={{border:"none", background:T.grey100, borderRadius:8, padding:6, cursor:"pointer"}}>
                <X size={15} color={T.grey600}/>
              </button>
            </div>

            <div style={{display:"flex", alignItems:"center", gap:12, marginBottom:16}}>
              <p style={{margin:0, fontSize:13, color:T.grey600}}>수량</p>
              <div style={{flex:1}}/>
              <button onClick={()=>setQty(q=>Math.max(1,q-1))} style={{width:34, height:34, borderRadius:9999, border:`1.5px solid ${T.grey200}`, background:T.white, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center"}}>
                <Minus size={15} color={T.grey700}/>
              </button>
              <p style={{margin:0, fontSize:22, fontWeight:700, color:T.grey900, minWidth:36, textAlign:"center", fontVariantNumeric:"tabular-nums"}}>{qty}</p>
              <button onClick={()=>setQty(q=>q+1)} style={{width:34, height:34, borderRadius:9999, border:"none", background:T.blue500, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center"}}>
                <Plus size={15} color={T.white}/>
              </button>
            </div>

            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8}}>
              <button onClick={()=>handleAction("in")} style={{padding:"14px 0", borderRadius:9999, border:"none", background:T.blue500, color:T.white, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:font}}>
                입고 +{qty}
              </button>
              <button onClick={()=>handleAction("out")} style={{padding:"14px 0", borderRadius:9999, border:"none", background:T.red500, color:T.white, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:font}}>
                출고 -{qty}
              </button>
            </div>
          </div>
        )}

        {!selected && results.length === 0 && !query && (
          <p style={{margin:0, fontSize:13, color:T.grey400, textAlign:"center", padding:"8px 0"}}>
            {camError ? "품목명을 검색하세요" : "바코드 스캔 또는 품목명을 검색하세요"}
          </p>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
