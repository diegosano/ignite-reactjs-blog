import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import ptBR from 'date-fns/locale/pt-BR';
import { FiUser, FiCalendar, FiClock } from 'react-icons/fi';
import { format } from 'date-fns';
import { RichText } from 'prismic-dom';

import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  uid: string;
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

const AVERAGE_WORDS_MINUTE = 200;

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  const contentTotalWords = post.data.content.reduce((total, content) => {
    const headingWords = content.heading.match(/\S+/g).length;
    const bodyWords = content.body.reduce((totalBodyWords, bodyContent) => {
      return totalBodyWords + bodyContent.text.match(/\S+/g).length;
    }, 0);

    return total + headingWords + bodyWords;
  }, 0);

  const readingTime = Math.ceil(contentTotalWords / AVERAGE_WORDS_MINUTE);

  return (
    <>
      <Header />

      <img className={styles.banner} src={post.data.banner.url} alt="" />

      <main className={commonStyles.container}>
        {router.isFallback && <div>Carregando...</div>}

        <article className={styles.post}>
          <h1>{post.data.title}</h1>

          <div className={styles.infoContainer}>
            <div className={styles.info}>
              <FiCalendar />
              <span>
                {format(new Date(post.first_publication_date), 'd MMM yyyy', {
                  locale: ptBR,
                })}
              </span>
            </div>

            <div className={styles.info}>
              <FiUser />
              <span>{post.data.author}</span>
            </div>

            <div className={styles.info}>
              <FiClock />
              <span>{`${readingTime} min`}</span>
            </div>
          </div>

          <div className={styles.content}>
            {post.data.content.map(({ heading, body }) => {
              return (
                <section key={`post-content-${heading}`}>
                  <h2>{heading}</h2>
                  <div
                    className={styles.paragraphs}
                    // eslint-disable-next-line react/no-danger
                    dangerouslySetInnerHTML={{ __html: RichText.asHtml(body) }}
                  />
                </section>
              );
            })}
          </div>
        </article>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient({});

  const response = await prismic.getByType('posts');

  const paths = response.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient({});

  const response = await prismic.getByUID('posts', String(slug));

  const { uid, first_publication_date, data } = response;

  const post = {
    uid,
    first_publication_date,
    data: {
      title: data.title,
      subtitle: data.subtitle,
      author: data.author,
      banner: {
        url: data.banner?.url,
      },
      content: data.content.map(content => {
        return {
          heading: content.heading,
          body: content.body,
        };
      }),
    },
  };

  return {
    props: {
      post,
    },
  };
};
