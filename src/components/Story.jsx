import Section from './Section'

export default function Story() {
  return (
    <Section id="hikaye" className="story">
      <p className="eyebrow">Hikâyemiz</p>
      <h2 className="title">Ve o soru soruldu…</h2>
      <figure className="photo">
        <div className="photo__wrap">
          <div className="photo__frame">
            <img src="/cift.jpg" alt="Muhammed İsmet ve Tuğçe, akvaryum önünde evlilik teklifi anı"
              width="640" height="640" loading="lazy" />
          </div>
          <span className="photo__badge">Evet dedi! 💍</span>
        </div>
        <figcaption className="photo__caption">
          Evet, su altında. Evet, dalgıçla. <br />
          <span>Hayır, balıklar davetli değil 🐠</span>
        </figcaption>
      </figure>
    </Section>
  )
}
