import { GetServerSideProps, GetStaticPaths, GetStaticProps } from 'next';
import { FiUser, FiCalendar, FiClock } from 'react-icons/fi';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import Header from '../../components/Header';

interface Post {
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

export default function Post({ post }: PostProps): JSX.Element {
  const AVERAGE_WORDS_MINUTE = 200;
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
        <article className={styles.post}>
          <h1>{post.data.title}</h1>

          <div className={styles.infoContainer}>
            <div className={styles.info}>
              <FiCalendar />
              <span>{post.first_publication_date}</span>
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
                <>
                  <h2>{heading}</h2>
                  <div
                    className={styles.paragraphs}
                    // eslint-disable-next-line react/no-danger
                    dangerouslySetInnerHTML={{ __html: RichText.asHtml(body) }}
                  />
                </>
              );
            })}
          </div>
        </article>
      </main>
    </>
  );
}

 export const getStaticPaths: GetStaticPaths = async () => {
   const prismic = getPrismicClient();
   const posts = await prismic.query(
     Prismic.Predicates.at('document.type', 'posts')
   );
   const paths = posts.map((post) => {
     params: {slug: post.slug},
   });
   
   return {
     paths,
     fallback: 'blocking',
   };
 };

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();

  const response = await prismic.getByUID('posts', String(slug), {});

  const { first_publication_date, data } = response;

  const post = {
    slug,
    title: data.title,
    subtitle: data.subtitle,
    author: data.author,
    banner: {
      url: data.banner?.url,
    },
    content: data.content.map(content => {
      return {
        heading: content.heading,
        body: [...content.body],
      };
    }),
  };

  return {
    props: {
      post: {
        first_publication_date: format(
          new Date(first_publication_date),
          'd MMM yyyy',
          {
            locale: ptBR,
          }
        ),
        data: post,
      },
    },
  };
};
