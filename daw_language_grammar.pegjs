// daw_language_grammar.pegjs

// トップレベルで MacroDef（!i=…）も拾うように
Start
  = _ blocks:(HeaderBlock / MacroDef / TrackBlock / Comment / newline)* _ {
      const headers = blocks.filter(b => b && b.type === "header");
      const tracks  = blocks.filter(b => b && b.type === "track");
      const macros  = blocks.filter(b => b && b.type === "macro");
      return { headers, tracks, macros };
    }

// ─── ヘッダ（@key …） ───────────────────────────
HeaderBlock
  = _ "@" key:Identifier _ val:HeaderValue newline {
      return { type: "header", key, val };
    }

// 値は quotation か数値か単語、あるいは改行以外の連続
HeaderValue
  = Quoted
  / Number
  / Identifier
  / value:(!newline .)+ {
      return value.map(x => (typeof x === 'string' ? x : x.text?.() ?? '')).join('').replace(/\s+/g, ' ').trim();
    }


// ─── トラック定義 ───────────────────────────────
TrackBlock
  = _ "track" _ name:Identifier ":" _ lines:TrackLine* {
      return { type: "track", name, lines };
    }

TrackLine
  = _ line:(ChordLine / NoteLine / MacroDef / Comment) _ newline? {
      return line;
    }

// ─── ノート行 ─────────────────────────────────
NoteLine
  = bar:Integer "-" beat:DecimalOrInt "-" note:NoteName "-" octave:Integer "-" duration:Duration velocity:Velocity? {
      return { type: "note", bar, beat, note, octave, duration, velocity };
    }

// ─── コード行 ─────────────────────────────────
ChordLine
  = bar:Integer "-" beat:DecimalOrInt "-" "(" notes:NoteList ")" "-" octave:Integer "-" duration:Duration velocity:Velocity? {
      return { type: "chord", bar, beat, notes, octave, duration, velocity };
    }

// ─── マクロ定義 ─────────────────────────────────
MacroDef
  = "!" name:Identifier _ "=" _ val:NoteList {
      return { type: "macro", name, val };
    }

// ─── コメント行 ─────────────────────────────────
Comment
  = "#" [^\n]* { return null; }

// ─── 音名 ───────────────────────────────────────
NoteName
  // マクロ呼び出し (!i) も許容
  = "!" id:Identifier { return "!" + id; }
  / "x"          { return "x"; }
  / note:Degree mod:Mod? {
      return note + (mod ?? "");
    }

// ─── NoteList（括弧つき）─────────────────────────
NoteList
  = "(" _ head:NoteName tail:(_ "," _ NoteName)* _ ")" {
      return [head, ...tail.map(t => t[3])];
    }

// ─── Velocity, Duration など──────────────────────
Velocity    = "-" v:Integer             { return v; }
Duration    = digits:[0-9]+ unit:("n"/"t") { return digits.join("") + unit; }
Mod         = [#b]
Degree      = [1-7]

// ─── 識別子・文字列・数値────────────────────────
Identifier = first:[a-zA-Z_] rest:[a-zA-Z0-9_]* {
  return first + rest.join("");
}
Quoted      = "\"" chars:[^"]* "\""        { return chars.join(""); }
Integer     = digits:[0-9]+                { return parseInt(digits.join(""), 10); }
DecimalOrInt
            = i:[0-9]+ f:("." [0-9]+)? {
                return f ? parseFloat(i.join("") + f[0] + f[1].join("")) 
                         : parseInt(i.join(""), 10);
              }
Number      = DecimalOrInt

// ─── 改行と空白────────────────────────────────
newline     = [ \t\r]* ("\r\n" / "\n" / "\r")
_           = [ \t\r\n]*

