import React from 'react';

const HelpModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      backdropFilter: 'blur(10px)',
      padding: '20px'
    }} onClick={onClose}>
      <div style={{
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        backgroundColor: 'var(--bg-white)',
        borderRadius: '30px',
        padding: '3rem',
        position: 'relative',
        overflowY: 'auto',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid rgba(var(--color-primary-rgb), 0.2)'
      }} onClick={e => e.stopPropagation()}>
        
        <button onClick={onClose} style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-main)',
          opacity: 0.5
        }}>
          <span className="material-icons" style={{ fontSize: '2rem' }}>close</span>
        </button>

        <h2 style={{ color: 'var(--color-primary)', fontWeight: '800', fontSize: '2.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span className="material-icons" style={{ fontSize: '2.5rem' }}>auto_awesome</span>
          Przewodnik Social Media Creator
        </h2>
        
        <p style={{ fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '2rem', opacity: 0.8 }}>
          Witaj w profesjonalnym studio kreatywnym napędzanym modelami GEMINI. 
          Poniżej znajdziesz wszystko, co musisz wiedzieć, aby tworzyć treści najwyższej jakości.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <section>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--color-primary)', fontWeight: '700', marginBottom: '0.8rem' }}>
              <div style={{ background: 'var(--color-primary)', color: 'white', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>1</div>
              Zacznij od Pomysłu
            </h3>
            <p style={{ margin: 0, lineHeight: '1.6' }}>
              Wpisz temat posta w głównym polu generatora. Możesz wybrać dedykowany <strong>Workspace</strong> (zakładka na górze), aby AI znało strategię Twojej marki. 
              Kliknij "Generuj Post" – AI stworzy tekst, dobierze hashtagi i przygotuje techniczny plan wizualny.
            </p>
          </section>

          <section>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--color-primary)', fontWeight: '700', marginBottom: '0.8rem' }}>
              <div style={{ background: 'var(--color-primary)', color: 'white', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>2</div>
              Grafiki, Wideo i GIF-y
            </h3>
            <p style={{ margin: 0, lineHeight: '1.6' }}>
              Po wygenerowaniu tekstu wybierz format (np. 1:1 lub 9:16) i kliknij <strong>Generuj Obraz</strong>, <strong>Wideo</strong> (6s klip) lub <strong>GIF</strong> (4s zapętlona animacja). 
              System wykorzystuje najnowsze modele <strong>Google Veo</strong>, oferując kinową jakość i płynny ruch.
            </p>
          </section>

          <section style={{ backgroundColor: 'rgba(var(--color-primary-rgb), 0.05)', padding: '2rem', borderRadius: '25px', borderLeft: '6px solid var(--color-primary)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--color-primary)', fontWeight: '800', marginBottom: '1rem', margin: 0 }}>
              <span className="material-icons" style={{ fontSize: '2rem' }}>auto_fix_high</span>
              Magia Iteracji (Rafinacja)
            </h3>
            <p style={{ margin: '0.5rem 0', fontWeight: '600', color: 'var(--text-main)' }}>To jest serce Twojego studia!</p>
            <p style={{ margin: '0.5rem 0', lineHeight: '1.6' }}>
              Nie musisz zaczynać od nowa, jeśli coś Ci nie pasuje. Pod każdym postem i zdjęciem znajdziesz pole <strong>"Zaproponuj poprawki"</strong>. 
              Możesz napisać: <i>"zmień kolor neonu na niebieski"</i> lub <i>"niech postać uśmiecha się bardziej"</i>. 
            </p>
            <p style={{ margin: '0.5rem 0', fontSize: '0.9rem', opacity: 0.8 }}>
              Dzięki funkcji <strong>Deep Scene Reconstruction</strong>, system przeanalizuje Twoje obecne zdjęcie i naniesie na nie poprawki, zachowując <strong>spójność wizualną</strong> (tę samą architekturę, postacie i oświetlenie).
            </p>
          </section>

          <section>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--color-primary)', fontWeight: '700', marginBottom: '0.8rem' }}>
              <div style={{ background: 'var(--color-primary)', color: 'white', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>3</div>
              Edytor Wizualny (Ewolucja Obrazu)
            </h3>
            <p style={{ margin: 0, lineHeight: '1.6' }}>
              Chcesz tchnąć życie we własne zdjęcie? Wgraj je w zakładce <strong>Edytor Wizualny</strong>. Możesz opisać zmiany (np. "zmień tło na kosmiczne") lub od razu zamienić zdjęcie w animowany GIF lub Wideo. 
              Pamiętaj, że każda zmiana w edytorze zachowuje spójność poprzedniego kroku, pozwalając na precyzyjne dopracowanie projektu.
            </p>
          </section>

          <section>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--color-primary)', fontWeight: '700', marginBottom: '0.8rem' }}>
              <div style={{ background: 'var(--color-primary)', color: 'white', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>4</div>
              Przestrzenie Robocze (Workspaces)
            </h3>
            <p style={{ margin: 0, lineHeight: '1.6' }}>
              To tutaj "uczysz" AI swojej marki. Stwórz przestrzeń roboczą, zdefiniuj <strong>wytyczne merytoryczne</strong> (np. ton wypowiedzi) oraz <strong>styl wizualny</strong> (np. kolorystyka, typ oświetlenia). 
              Gdy przestrzeń jest aktywna, każdy post i grafika będą automatycznie dopasowane do Twojej marki.
            </p>
          </section>

          <section>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--color-primary)', fontWeight: '700', marginBottom: '0.8rem' }}>
              <div style={{ background: 'var(--color-primary)', color: 'white', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>5</div>
              Planowanie Kampanii (Strategia)
            </h3>
            <p style={{ margin: 0, lineHeight: '1.6' }}>
              Zamiast pojedynczych postów, buduj kompletne strategie. Określ cel kampanii, czas trwania i intensywność, a AI wygeneruje <strong>wielodniowy harmonogram</strong> na wybrane platformy. 
              Każdy element kampanii możesz jednym kliknięciem przesłać do generatora, aby zamienić pomysł w gotowy post.
            </p>
          </section>

          <section>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--color-primary)', fontWeight: '700', marginBottom: '0.8rem' }}>
              <div style={{ background: 'var(--color-primary)', color: 'white', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>6</div>
              Zarządzanie i Historia
            </h3>
            <p style={{ margin: 0, lineHeight: '1.6' }}>
              Użyj <strong>Historii Projektów</strong> (szuflada po lewej stronie), aby wrócić do wcześniejszych prac lub zobaczyć ewolucję swoich projektów. 
            </p>
          </section>

          <section>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--color-primary)', fontWeight: '700', marginBottom: '0.8rem' }}>
              <div style={{ background: 'var(--color-primary)', color: 'white', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>7</div>
              Instalacja Aplikacji (PWA)
            </h3>
            <p style={{ margin: 0, lineHeight: '1.6' }}>
              Możesz używać Social Media Creator jako natywnej aplikacji na swoim komputerze lub telefonie. 
              Jeśli Twoja przeglądarka to wspiera, w prawym górnym rogu zobaczysz zielony przycisk <strong>Zainstaluj</strong>. Dzięki temu zyskasz szybki dostęp do narzędzia bezpośrednio z pulpitu.
            </p>
          </section>

          <section>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--color-primary)', fontWeight: '700', marginBottom: '0.8rem' }}>
              <div style={{ background: 'var(--color-primary)', color: 'white', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>8</div>
              Raporty Analizy (Visual Auditor)
            </h3>
            <p style={{ margin: 0, lineHeight: '1.6' }}>
              Czarny pasek pod zdjęciem to log "Visual Auditora". Pokazuje on dwujęzyczny raport z tego, co AI "widzi" na obrazie. 
              Daje Ci to pewność, że system "zamroził" kluczowe elementy sceny przed naniesieniem Twoich poprawek.
            </p>
          </section>

        </div>

        <button onClick={onClose} className="btn-primary" style={{ marginTop: '3rem', width: '100%', padding: '1.4rem', borderRadius: '25px', fontSize: '1.2rem', fontWeight: '700', boxShadow: '0 10px 20px rgba(var(--color-primary-rgb), 0.3)' }}>
          Gotowe, zaczynajmy!
        </button>
      </div>
    </div>
  );
};

export default HelpModal;
